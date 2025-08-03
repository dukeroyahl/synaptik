package org.dukeroyahl.synaptik.service;

import org.jboss.logging.Logger;

import jakarta.annotation.PostConstruct;
import jakarta.enterprise.context.ApplicationScoped;
import java.util.List;
import java.util.Properties;
import java.util.ArrayList;
import java.util.regex.Pattern;
import java.util.regex.Matcher;

@ApplicationScoped
public class StanfordNLPService {
    
    private static final Logger logger = Logger.getLogger(StanfordNLPService.class);
    
    private Object pipeline;
    private boolean stanfordAvailable = false;
    
    // Fallback regex patterns for when Stanford NLP is not available
    private static final Pattern PERSON_PATTERN = Pattern.compile("\\b(?:with|meet|call|talk\\s+to)\\s+([A-Z][a-z]+(?:\\s+[A-Z][a-z]+)?)\\b");
    private static final Pattern TIME_PATTERN = Pattern.compile("\\b(?:at\\s+)?(\\d{1,2})(?::(\\d{2}))?(am|pm|AM|PM)?\\b");
    private static final Pattern DATE_PATTERN = Pattern.compile("\\b(today|tomorrow|yesterday|monday|tuesday|wednesday|thursday|friday|saturday|sunday|next\\s+\\w+|\\d+/\\d+|\\d+-\\d+-\\d+)\\b", Pattern.CASE_INSENSITIVE);
    private static final Pattern PRIORITY_PATTERN = Pattern.compile("\\b(urgent|asap|high\\s+priority|important|critical|low\\s+priority|when\\s+possible)\\b", Pattern.CASE_INSENSITIVE);
    
    @PostConstruct
    public void initializePipeline() {
        logger.info("Attempting to initialize Stanford CoreNLP pipeline...");
        
        try {
            // Try to load Stanford NLP classes
            Class<?> pipelineClass = Class.forName("edu.stanford.nlp.pipeline.StanfordCoreNLP");
            
            Properties props = new Properties();
            props.setProperty("annotators", "tokenize,ssplit,pos,ner");
            props.setProperty("outputFormat", "json");
            
            // Create pipeline using reflection to avoid compile-time dependency
            this.pipeline = pipelineClass.getConstructor(Properties.class).newInstance(props);
            this.stanfordAvailable = true;
            
            logger.info("Stanford CoreNLP pipeline initialized successfully");
        } catch (Exception e) {
            logger.warnf("Stanford CoreNLP not available, using fallback regex-based parsing: %s", e.getMessage());
            this.stanfordAvailable = false;
        }
    }
    
    public NLPResult processText(String text) {
        logger.debugf("Processing text: %s", text);
        
        if (stanfordAvailable && pipeline != null) {
            return processWithStanford(text);
        } else {
            return processWithRegex(text);
        }
    }
    
    private NLPResult processWithStanford(String text) {
        try {
            // Use reflection to call Stanford NLP
            Class<?> documentClass = Class.forName("edu.stanford.nlp.pipeline.CoreDocument");
            Object document = documentClass.getConstructor(String.class).newInstance(text);
            
            // Annotate document
            pipeline.getClass().getMethod("annotate", Object.class).invoke(pipeline, document);
            
            // Extract information using reflection
            NLPResult result = new NLPResult();
            result.originalText = text;
            result.entities = extractEntitiesWithReflection(document);
            result.timeExpressions = extractTimeWithReflection(document);
            
            logger.debugf("Stanford NLP processed: %s", result);
            return result;
            
        } catch (Exception e) {
            logger.warnf("Stanford processing failed, falling back to regex: %s", e.getMessage());
            return processWithRegex(text);
        }
    }
    
    private NLPResult processWithRegex(String text) {
        NLPResult result = new NLPResult();
        result.originalText = text;
        result.entities = new ArrayList<>();
        result.timeExpressions = new ArrayList<>();
        
        // Extract persons
        Matcher personMatcher = PERSON_PATTERN.matcher(text);
        while (personMatcher.find()) {
            result.entities.add(new EntityInfo("PERSON", personMatcher.group(1), personMatcher.start(), personMatcher.end()));
        }
        
        // Extract times
        Matcher timeMatcher = TIME_PATTERN.matcher(text);
        while (timeMatcher.find()) {
            result.timeExpressions.add(new TimeInfo(timeMatcher.group(0), timeMatcher.start(), timeMatcher.end()));
        }
        
        // Extract dates
        Matcher dateMatcher = DATE_PATTERN.matcher(text);
        while (dateMatcher.find()) {
            result.timeExpressions.add(new TimeInfo(dateMatcher.group(0), dateMatcher.start(), dateMatcher.end()));
        }
        
        logger.debugf("Regex NLP processed: %s", result);
        return result;
    }
    
    private List<EntityInfo> extractEntitiesWithReflection(Object document) {
        List<EntityInfo> entities = new ArrayList<>();
        try {
            // This would use Stanford NLP reflection to extract named entities
            // For now, return empty list as fallback
        } catch (Exception e) {
            logger.debugf("Failed to extract entities with Stanford: %s", e.getMessage());
        }
        return entities;
    }
    
    private List<TimeInfo> extractTimeWithReflection(Object document) {
        List<TimeInfo> timeInfos = new ArrayList<>();
        try {
            // This would use Stanford NLP reflection to extract time expressions
            // For now, return empty list as fallback
        } catch (Exception e) {
            logger.debugf("Failed to extract time with Stanford: %s", e.getMessage());
        }
        return timeInfos;
    }
    
    public boolean isStanfordAvailable() {
        return stanfordAvailable;
    }
    
    // Data classes for NLP results
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
