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
import java.net.URL;
import java.util.ArrayList;
import java.util.Arrays;
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
    
    // Enhanced fallback regex patterns
    private static final Pattern PERSON_PATTERN = Pattern.compile(
        "\\b(?:with|meet(?:ing)?(?:\\s+with)?|call|talk\\s+to|assign(?:ed)?\\s+to|for)\\s+([A-Z][a-z]+(?:\\s+[A-Z][a-z]+)?)(?=\\s+(?:at\\s+the|at\\s+|in\\s+the|in\\s+|on\\s+|about|regarding|tomorrow|today|yesterday|next\\s+\\w+|\\d)|\\s*$)", 
        Pattern.CASE_INSENSITIVE
    );
    
    private static final Pattern TIME_PATTERN = Pattern.compile(
        "\\b(?:at\\s+)?(\\d{1,2})(?::(\\d{2}))?(am|pm|AM|PM)?\\b"
    );
    
    private static final Pattern DATE_PATTERN = Pattern.compile(
        "\\b(today|tomorrow|yesterday|monday|tuesday|wednesday|thursday|friday|saturday|sunday|next\\s+\\w+|in\\s+a\\s+week|a\\s+week\\s+from\\s+now|next\\s+week|\\d+\\s+weeks?\\s+from\\s+now|in\\s+\\d+\\s+weeks?|\\d+\\s+days?\\s+from\\s+now|in\\s+\\d+\\s+days?|\\d+/\\d+|\\d+-\\d+-\\d+|by\\s+\\w+)\\b", 
        Pattern.CASE_INSENSITIVE
    );
    
    private static final Pattern LOCATION_PATTERN = Pattern.compile(
        "\\b(?:at|in|near|by)\\s+(?:the\\s+)?(office|home|library|restaurant|cafe|meeting\\s+room|conference\\s+room|[A-Z][a-zA-Z\\s]+(?:Building|Room|Street|Avenue|Drive))\\b", 
        Pattern.CASE_INSENSITIVE
    );
    
    private static final Pattern ORGANIZATION_PATTERN = Pattern.compile(
        "\\b([A-Z][a-zA-Z]*(?:\\s+[A-Z][a-zA-Z]*)*(?:\\s+(?:Inc|Corp|LLC|Ltd|Company|Organization|Department|Team|Group)))\\b"
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
            
            // Find entities using OpenNLP models
            result.entities.addAll(findEntities(tokens, personNameFinder, "PERSON", text));
            result.entities.addAll(findEntities(tokens, locationNameFinder, "LOCATION", text));
            result.entities.addAll(findEntities(tokens, organizationNameFinder, "ORGANIZATION", text));
            
            // Find time/date entities
            result.timeExpressions.addAll(findTimeEntities(tokens, dateNameFinder, text));
            result.timeExpressions.addAll(findTimeEntities(tokens, timeNameFinder, text));
            
            // Add regex-based patterns as fallback for missed entities
            addRegexFallbackEntities(text, result);
            
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
    
    private void addRegexFallbackEntities(String text, NLPResult result) {
        // Add regex patterns for entities that OpenNLP might miss
        
        // Enhanced person detection
        Matcher personMatcher = PERSON_PATTERN.matcher(text);
        while (personMatcher.find()) {
            String personName = personMatcher.group(1);
            // Check if we already found this person
            boolean alreadyFound = result.entities.stream()
                .anyMatch(e -> "PERSON".equals(e.type) && 
                         e.value.toLowerCase().contains(personName.toLowerCase()));
            
            if (!alreadyFound) {
                result.entities.add(new EntityInfo("PERSON", personName, 
                    personMatcher.start(1), personMatcher.end(1)));
            }
        }
        
        // Enhanced location detection
        Matcher locationMatcher = LOCATION_PATTERN.matcher(text);
        while (locationMatcher.find()) {
            String location = locationMatcher.group(1);
            boolean alreadyFound = result.entities.stream()
                .anyMatch(e -> "LOCATION".equals(e.type) && 
                         e.value.toLowerCase().contains(location.toLowerCase()));
            
            if (!alreadyFound) {
                result.entities.add(new EntityInfo("LOCATION", location, 
                    locationMatcher.start(1), locationMatcher.end(1)));
            }
        }
        
        // Enhanced organization detection
        Matcher orgMatcher = ORGANIZATION_PATTERN.matcher(text);
        while (orgMatcher.find()) {
            String org = orgMatcher.group(1);
            boolean alreadyFound = result.entities.stream()
                .anyMatch(e -> "ORGANIZATION".equals(e.type) && 
                         e.value.toLowerCase().contains(org.toLowerCase()));
            
            if (!alreadyFound) {
                result.entities.add(new EntityInfo("ORGANIZATION", org, 
                    orgMatcher.start(1), orgMatcher.end(1)));
            }
        }
        
        // Enhanced date/time detection
        Matcher dateMatcher = DATE_PATTERN.matcher(text);
        while (dateMatcher.find()) {
            String dateStr = dateMatcher.group(0);
            boolean alreadyFound = result.timeExpressions.stream()
                .anyMatch(t -> t.value.toLowerCase().contains(dateStr.toLowerCase()));
            
            if (!alreadyFound) {
                result.timeExpressions.add(new TimeInfo(dateStr, 
                    dateMatcher.start(), dateMatcher.end()));
            }
        }
        
        Matcher timeMatcher = TIME_PATTERN.matcher(text);
        while (timeMatcher.find()) {
            String timeStr = timeMatcher.group(0);
            boolean alreadyFound = result.timeExpressions.stream()
                .anyMatch(t -> t.value.toLowerCase().contains(timeStr.toLowerCase()));
            
            if (!alreadyFound) {
                result.timeExpressions.add(new TimeInfo(timeStr, 
                    timeMatcher.start(), timeMatcher.end()));
            }
        }
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