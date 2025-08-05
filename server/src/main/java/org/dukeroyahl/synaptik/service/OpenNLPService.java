package org.dukeroyahl.synaptik.service;

import org.jboss.logging.Logger;

import jakarta.annotation.PostConstruct;
import jakarta.enterprise.context.ApplicationScoped;
import opennlp.tools.tokenize.Tokenizer;
import opennlp.tools.tokenize.TokenizerME;
import opennlp.tools.tokenize.TokenizerModel;
import opennlp.tools.namefind.NameFinderME;
import opennlp.tools.namefind.TokenNameFinderModel;
import opennlp.tools.postag.POSModel;
import opennlp.tools.postag.POSTaggerME;
import opennlp.tools.sentdetect.SentenceDetectorME;
import opennlp.tools.sentdetect.SentenceModel;
import opennlp.tools.util.Span;

import java.io.IOException;
import java.io.InputStream;
import java.util.ArrayList;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@ApplicationScoped
public class OpenNLPService {
    
    private static final Logger logger = Logger.getLogger(OpenNLPService.class);
    
    // OpenNLP models
    private Tokenizer tokenizer;
    private SentenceDetectorME sentenceDetector;
    private NameFinderME personNameFinder;
    private NameFinderME locationNameFinder;
    private NameFinderME organizationNameFinder;
    private NameFinderME dateNameFinder;
    private NameFinderME timeNameFinder;
    private POSTaggerME posTagger;
    
    private boolean openNLPAvailable = false;
    
    // Minimal patterns - only for absolute fallback when models completely fail
    private static final Pattern BASIC_TIME_PATTERN = Pattern.compile(
        "\\b(\\d{1,2})(?::(\\d{2}))?(am|pm)\\b", Pattern.CASE_INSENSITIVE
    );
    
    private static final Pattern BASIC_DATE_PATTERN = Pattern.compile(
        "\\b(today|tomorrow|yesterday)\\b", Pattern.CASE_INSENSITIVE
    );
    
    @PostConstruct
    public void initializeModels() {
        logger.info("Attempting to initialize Apache OpenNLP models...");
        
        try {
            // Initialize tokenizer
            tokenizer = loadTokenizer();
            
            // Initialize sentence detector
            sentenceDetector = loadSentenceDetector();
            
            // Initialize name finders
            personNameFinder = loadPersonNameFinder();
            locationNameFinder = loadLocationNameFinder();
            organizationNameFinder = loadOrganizationNameFinder();
            dateNameFinder = loadDateNameFinder();
            timeNameFinder = loadTimeNameFinder();
            
            // Initialize POS tagger
            posTagger = loadPOSTagger();
            
            openNLPAvailable = true;
            logger.info("Apache OpenNLP models initialized successfully");
            
        } catch (Exception e) {
            logger.warnf("Apache OpenNLP models not available, using enhanced regex-based parsing: %s", e.getMessage());
            openNLPAvailable = false;
        }
    }
    
    public NLPResult processText(String text) {
        logger.debugf("Processing text with OpenNLP: %s", text);
        
        if (openNLPAvailable) {
            return processWithOpenNLP(text);
        } else {
            return processWithEnhancedRegex(text);
        }
    }
    
    private NLPResult processWithOpenNLP(String text) {
        try {
            NLPResult result = new NLPResult();
            result.originalText = text;
            result.entities = new ArrayList<>();
            result.timeExpressions = new ArrayList<>();
            
            // Tokenize text
            String[] tokens = tokenizer.tokenize(text);
            
            // Trust OpenNLP models first - they're trained on large datasets
            result.entities.addAll(findEntities(tokens, personNameFinder, "PERSON", text));
            result.entities.addAll(findEntities(tokens, locationNameFinder, "LOCATION", text));
            result.entities.addAll(findEntities(tokens, organizationNameFinder, "ORGANIZATION", text));
            
            // Find time/date entities using models
            result.timeExpressions.addAll(findTimeEntities(tokens, dateNameFinder, text));
            result.timeExpressions.addAll(findTimeEntities(tokens, timeNameFinder, text));
            
            // Only enhance what models missed with intelligent post-processing
            enhanceModelResults(text, result);
            
            logger.debugf("OpenNLP processed: %s", result);
            return result;
            
        } catch (Exception e) {
            logger.warnf("OpenNLP processing failed, falling back to regex: %s", e.getMessage());
            return processWithEnhancedRegex(text);
        }
    }
    
    private List<EntityInfo> findEntities(String[] tokens, NameFinderME nameFinder, String entityType, String originalText) {
        List<EntityInfo> entities = new ArrayList<>();
        
        if (nameFinder == null) {
            return entities;
        }
        
        try {
            Span[] spans = nameFinder.find(tokens);
            
            for (Span span : spans) {
                StringBuilder entityValue = new StringBuilder();
                int startPos = 0;
                int endPos = 0;
                
                // Reconstruct entity text from tokens
                for (int i = span.getStart(); i < span.getEnd(); i++) {
                    if (entityValue.length() > 0) {
                        entityValue.append(" ");
                    }
                    entityValue.append(tokens[i]);
                }
                
                // Find position in original text (approximate)
                int pos = originalText.toLowerCase().indexOf(entityValue.toString().toLowerCase());
                if (pos >= 0) {
                    startPos = pos;
                    endPos = pos + entityValue.length();
                }
                
                entities.add(new EntityInfo(entityType, entityValue.toString(), startPos, endPos));
            }
            
            // Clear adaptive data
            nameFinder.clearAdaptiveData();
            
        } catch (Exception e) {
            logger.debugf("Error finding %s entities: %s", entityType, e.getMessage());
        }
        
        return entities;
    }
    
    private List<TimeInfo> findTimeEntities(String[] tokens, NameFinderME nameFinder, String originalText) {
        List<TimeInfo> timeInfos = new ArrayList<>();
        
        if (nameFinder == null) {
            return timeInfos;
        }
        
        try {
            Span[] spans = nameFinder.find(tokens);
            
            for (Span span : spans) {
                StringBuilder timeValue = new StringBuilder();
                
                // Reconstruct time text from tokens
                for (int i = span.getStart(); i < span.getEnd(); i++) {
                    if (timeValue.length() > 0) {
                        timeValue.append(" ");
                    }
                    timeValue.append(tokens[i]);
                }
                
                // Find position in original text
                int pos = originalText.toLowerCase().indexOf(timeValue.toString().toLowerCase());
                int startPos = pos >= 0 ? pos : 0;
                int endPos = startPos + timeValue.length();
                
                timeInfos.add(new TimeInfo(timeValue.toString(), startPos, endPos));
            }
            
            // Clear adaptive data
            nameFinder.clearAdaptiveData();
            
        } catch (Exception e) {
            logger.debugf("Error finding time entities: %s", e.getMessage());
        }
        
        return timeInfos;
    }
    
    /**
     * Intelligent enhancement of model results using semantic understanding
     * rather than heavy regex patterns. This method trusts the ML models
     * and only adds minimal enhancements where absolutely necessary.
     */
    private void enhanceModelResults(String text, NLPResult result) {
        // Only enhance location detection for common location types that models might miss
        enhanceLocationDetectionMinimal(text, result);
        
        // Use contextual clues to identify missed persons in specific patterns
        enhancePersonDetectionContextual(text, result);
        
        // No heavy regex fallbacks - trust the trained models
        logger.debugf("Enhanced model results with minimal post-processing");
    }
    
    /**
     * Minimal location enhancement focusing on common location keywords
     * that OpenNLP models might not catch in context
     */
    private void enhanceLocationDetectionMinimal(String text, NLPResult result) {
        // Only check for very common location types that models consistently miss
        String[] criticalLocationKeywords = {"restaurant", "cafe", "office", "home", "building"};
        
        for (String keyword : criticalLocationKeywords) {
            // Simple check: if keyword appears after location prepositions
            if (text.toLowerCase().matches(".*\\b(?:at|in|near|by)\\s+(?:the\\s+)?.*" + keyword + "\\b.*")) {
                // Check if we already have this location
                boolean alreadyFound = result.entities.stream()
                    .anyMatch(e -> "LOCATION".equals(e.type) && 
                             e.value.toLowerCase().contains(keyword));
                
                if (!alreadyFound) {
                    // Extract the location phrase intelligently
                    String locationPhrase = extractLocationPhrase(text, keyword);
                    if (locationPhrase != null) {
                        result.entities.add(new EntityInfo("LOCATION", locationPhrase, 0, 0));
                        logger.debugf("Added minimal location enhancement: %s", locationPhrase);
                    }
                }
            }
        }
    }
    
    /**
     * Extract location phrase around a keyword using simple text analysis
     */
    private String extractLocationPhrase(String text, String keyword) {
        String lowerText = text.toLowerCase();
        String lowerKeyword = keyword.toLowerCase();
        
        int keywordIndex = lowerText.indexOf(lowerKeyword);
        if (keywordIndex == -1) return null;
        
        // Look backwards for adjectives (simple approach)
        int start = keywordIndex;
        String[] words = text.substring(0, keywordIndex).trim().split("\\s+");
        if (words.length > 0) {
            String previousWord = words[words.length - 1];
            // If previous word looks like an adjective (starts with capital, common adjectives)
            if (previousWord.matches("[A-Z][a-z]+") && 
                !previousWord.toLowerCase().matches("at|in|near|by|the")) {
                start = keywordIndex - previousWord.length() - 1;
            }
        }
        
        // Extract the phrase
        int end = keywordIndex + keyword.length();
        return text.substring(Math.max(0, start), end).trim();
    }
    
    /**
     * Minimal person detection enhancement for cases where context makes it clear
     */
    private void enhancePersonDetectionContextual(String text, NLPResult result) {
        // Only look for obvious person contexts that models might miss
        // Much simpler than heavy regex patterns
        String[] personContexts = {"with", "call", "meet"};
        
        for (String context : personContexts) {
            if (text.toLowerCase().contains(context + " ")) {
                // Let the model results handle this - don't override with regex
                // This is just for logging/debugging purposes
                logger.debugf("Found person context '%s' - trusting model results", context);
            }
        }
    }
    
    /**
     * Minimal regex fallback - only used when OpenNLP models completely fail
     * This should be the exception, not the rule
     */
    private void addRegexFallbackEntities(String text, NLPResult result) {
        logger.debugf("Using minimal regex fallback for text: %s", text);
        
        // Only basic time detection when models fail
        Matcher timeMatcher = BASIC_TIME_PATTERN.matcher(text);
        while (timeMatcher.find()) {
            String timeStr = timeMatcher.group(0);
            result.timeExpressions.add(new TimeInfo(timeStr, 
                timeMatcher.start(), timeMatcher.end()));
        }
        
        // Only basic date detection when models fail
        Matcher dateMatcher = BASIC_DATE_PATTERN.matcher(text);
        while (dateMatcher.find()) {
            String dateStr = dateMatcher.group(0);
            result.timeExpressions.add(new TimeInfo(dateStr, 
                dateMatcher.start(), dateMatcher.end()));
        }
        
        // No complex person/location/organization patterns - trust models or fail gracefully
        logger.debugf("Minimal regex fallback complete - relying on model training data");
    }
    
    private NLPResult processWithEnhancedRegex(String text) {
        NLPResult result = new NLPResult();
        result.originalText = text;
        result.entities = new ArrayList<>();
        result.timeExpressions = new ArrayList<>();
        
        // Enhanced regex-based entity extraction
        addRegexFallbackEntities(text, result);
        
        logger.debugf("Enhanced regex NLP processed: %s", result);
        return result;
    }
    
    // Model loading methods using packaged models
    private Tokenizer loadTokenizer() throws IOException {
        try (InputStream is = getModelStream("en-token.bin")) {
            TokenizerModel model = new TokenizerModel(is);
            return new TokenizerME(model);
        }
    }
    
    private SentenceDetectorME loadSentenceDetector() throws IOException {
        try (InputStream is = getModelStream("en-sent.bin")) {
            SentenceModel model = new SentenceModel(is);
            return new SentenceDetectorME(model);
        }
    }
    
    private NameFinderME loadPersonNameFinder() throws IOException {
        try (InputStream is = getModelStream("en-ner-person.bin")) {
            TokenNameFinderModel model = new TokenNameFinderModel(is);
            return new NameFinderME(model);
        }
    }
    
    private NameFinderME loadLocationNameFinder() throws IOException {
        try (InputStream is = getModelStream("en-ner-location.bin")) {
            TokenNameFinderModel model = new TokenNameFinderModel(is);
            return new NameFinderME(model);
        }
    }
    
    private NameFinderME loadOrganizationNameFinder() throws IOException {
        try (InputStream is = getModelStream("en-ner-organization.bin")) {
            TokenNameFinderModel model = new TokenNameFinderModel(is);
            return new NameFinderME(model);
        }
    }
    
    private NameFinderME loadDateNameFinder() throws IOException {
        try (InputStream is = getModelStream("en-ner-date.bin")) {
            TokenNameFinderModel model = new TokenNameFinderModel(is);
            return new NameFinderME(model);
        }
    }
    
    private NameFinderME loadTimeNameFinder() throws IOException {
        try (InputStream is = getModelStream("en-ner-time.bin")) {
            TokenNameFinderModel model = new TokenNameFinderModel(is);
            return new NameFinderME(model);
        }
    }
    
    private POSTaggerME loadPOSTagger() throws IOException {
        try (InputStream is = getModelStream("en-pos.bin")) {
            POSModel model = new POSModel(is);
            return new POSTaggerME(model);
        }
    }
    
    private InputStream getModelStream(String modelName) throws IOException {
        // Load from packaged models in classpath
        InputStream is = getClass().getClassLoader().getResourceAsStream("models/" + modelName);
        
        if (is == null) {
            logger.warnf("Model not found in classpath: models/%s", modelName);
            throw new IOException("Model not available: " + modelName);
        }
        
        logger.debugf("Loaded OpenNLP model from classpath: %s", modelName);
        return is;
    }
    
    public boolean isOpenNLPAvailable() {
        return openNLPAvailable;
    }
    
    // Data classes for NLP results (reusing from original)
    public static class NLPResult {
        public String originalText;
        public List<EntityInfo> entities = new ArrayList<>();
        public List<TimeInfo> timeExpressions = new ArrayList<>();
        
        @Override
        public String toString() {
            return String.format("NLPResult{text='%s', entities=%d, times=%d}", 
                originalText, entities.size(), timeExpressions.size());
        }
    }
    
    public static class EntityInfo {
        public String type;
        public String value;
        public int start;
        public int end;
        
        public EntityInfo(String type, String value, int start, int end) {
            this.type = type;
            this.value = value;
            this.start = start;
            this.end = end;
        }
        
        @Override
        public String toString() {
            return String.format("Entity{%s: '%s'}", type, value);
        }
    }
    
    public static class TimeInfo {
        public String value;
        public int start;
        public int end;
        
        public TimeInfo(String value, int start, int end) {
            this.value = value;
            this.start = start;
            this.end = end;
        }
        
        @Override
        public String toString() {
            return String.format("Time{'%s'}", value);
        }
    }
}