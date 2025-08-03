package org.dukeroyahl.synaptik.service;

import edu.stanford.nlp.pipeline.CoreDocument;
import edu.stanford.nlp.pipeline.StanfordCoreNLP;
import edu.stanford.nlp.ling.CoreAnnotations;
import edu.stanford.nlp.ling.CoreLabel;
import edu.stanford.nlp.time.TimeAnnotations;
import edu.stanford.nlp.time.TimeExpression;
import edu.stanford.nlp.util.CoreMap;
import org.jboss.logging.Logger;

import jakarta.annotation.PostConstruct;
import jakarta.enterprise.context.ApplicationScoped;
import java.util.List;
import java.util.Properties;

@ApplicationScoped
public class StanfordNLPService {
    
    private static final Logger logger = Logger.getLogger(StanfordNLPService.class);
    
    private StanfordCoreNLP pipeline;
    
    @PostConstruct
    public void initializePipeline() {
        logger.info("Initializing Stanford CoreNLP pipeline...");
        
        Properties props = new Properties();
        // Configure pipeline with essential annotators for task parsing
        props.setProperty("annotators", "tokenize,ssplit,pos,lemma,ner,parse,sentiment");
        props.setProperty("coref.algorithm", "neural");
        props.setProperty("ner.useSUTime", "true");
        props.setProperty("ner.applyNumericClassifiers", "true");
        props.setProperty("outputFormat", "json");
        
        try {
            this.pipeline = new StanfordCoreNLP(props);
            logger.info("Stanford CoreNLP pipeline initialized successfully");
        } catch (Exception e) {
            logger.errorf("Failed to initialize Stanford CoreNLP pipeline: %s", e.getMessage());
            // Fallback to basic pipeline without models
            props.setProperty("annotators", "tokenize,ssplit,pos");
            this.pipeline = new StanfordCoreNLP(props);
            logger.warn("Using basic Stanford CoreNLP pipeline without advanced models");
        }
    }
    
    public CoreDocument processText(String text) {
        if (pipeline == null) {
            throw new IllegalStateException("Stanford CoreNLP pipeline not initialized");
        }
        
        logger.debugf("Processing text with Stanford NLP: %s", text);
        CoreDocument document = new CoreDocument(text);
        pipeline.annotate(document);
        return document;
    }
    
    public List<CoreMap> extractTimeExpressions(CoreDocument document) {
        return document.annotation().get(TimeAnnotations.TimexAnnotations.class);
    }
    
    public List<CoreLabel> getTokens(CoreDocument document) {
        return document.tokens();
    }
    
    public List<CoreMap> getSentences(CoreDocument document) {
        return document.annotation().get(CoreAnnotations.SentencesAnnotation.class);
    }
    
    /**
     * Extract named entities by type
     */
    public List<CoreLabel> getNamedEntitiesByType(CoreDocument document, String entityType) {
        return document.tokens().stream()
            .filter(token -> entityType.equals(token.get(CoreAnnotations.NamedEntityTagAnnotation.class)))
            .toList();
    }
    
    /**
     * Get sentiment of the text (POSITIVE, NEGATIVE, NEUTRAL)
     */
    public String getSentiment(CoreDocument document) {
        if (!document.sentences().isEmpty()) {
            return document.sentences().get(0).sentiment();
        }
        return "NEUTRAL";
    }
}
