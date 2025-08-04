// Simple test to verify urgency detection
import org.dukeroyahl.synaptik.service.NaturalLanguageParser;
import org.dukeroyahl.synaptik.service.OpenNLPService;
import org.dukeroyahl.synaptik.domain.Task;

public class test_urgency {
    public static void main(String[] args) {
        System.out.println("Testing urgency detection...");
        
        // Create services
        OpenNLPService nlpService = new OpenNLPService();
        nlpService.initializeModels();
        
        NaturalLanguageParser parser = new NaturalLanguageParser();
        
        // Inject NLP service
        try {
            var nlpServiceField = NaturalLanguageParser.class.getDeclaredField("nlpService");
            nlpServiceField.setAccessible(true);
            nlpServiceField.set(parser, nlpService);
        } catch (Exception e) {
            e.printStackTrace();
            return;
        }
        
        // Test various urgency expressions
        String[] testInputs = {
            "URGENT: Fix production bug immediately",
            "Send urgent email to client about contract",
            "Critical issue with payment system ASAP",
            "Emergency: Server is down!",
            "Important meeting with CEO tomorrow",
            "Must complete report by end of day",
            "Send regular email to teammate",
            "Write documentation when possible"
        };
        
        for (String input : testInputs) {
            try {
                Task task = parser.parseNaturalLanguage(input);
                System.out.printf("Input: \"%s\"\n", input);
                System.out.printf("  Priority: %s\n", task.priority);
                System.out.printf("  Tags: %s\n", task.tags);
                System.out.printf("  Urgency: %.1f\n", task.urgency != null ? task.urgency : 0.0);
                System.out.println();
            } catch (Exception e) {
                System.out.printf("Error processing: %s - %s\n", input, e.getMessage());
            }
        }
    }
}