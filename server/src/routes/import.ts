import { Router, Request, Response } from 'express';
import { importTasksFromTaskWarrior, forceImportTasksFromTaskWarrior } from '../utils/taskwarriorImport';

export const importRoutes = Router();

// POST /api/import/taskwarrior - Import tasks from TaskWarrior
importRoutes.post('/taskwarrior', async (req: Request, res: Response) => {
  try {
    const { force = false } = req.body;
    
    const result = force 
      ? await forceImportTasksFromTaskWarrior()
      : await importTasksFromTaskWarrior();
    
    if (result.success) {
      res.status(200).json({
        success: true,
        message: result.message,
        count: result.count
      });
    } else {
      res.status(400).json({
        success: false,
        message: result.message
      });
    }
  } catch (error: any) {
    console.error('Error in import route:', error);
    res.status(500).json({
      success: false,
      message: `Server error during import: ${error.message}`
    });
  }
});
