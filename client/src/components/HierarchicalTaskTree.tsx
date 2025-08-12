import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  useTheme, 
  FormControlLabel, 
  Switch, 
  Slider, 
  Collapse, 
  IconButton,
  ToggleButtonGroup,
  ToggleButton,
  Tooltip,
  Chip
} from '@mui/material';
import { 
  AccountTree,
  ViewList,
  RadioButtonUnchecked,
  Timeline,
  ExpandMore,
  ExpandLess
} from '@mui/icons-material';
import * as d3 from 'd3';
import { TaskDTO } from '../types';
import { getPriorityConfig } from '../utils/priorityUtils';

interface HierarchicalTaskTreeProps {
  tasks: TaskDTO[];
  width?: number;
  height?: number;
}

// Note: TreeNode interface available but not used in current implementation

interface TaskTreeData {
  id: string;
  title: string;
  status: string;
  priority: string;
  projectName?: string;
  level: number;
  taskData: TaskDTO;
  children?: TaskTreeData[];
}

type LayoutType = 'vertical' | 'horizontal' | 'radial';
type TreeType = 'tree' | 'cluster';

const HierarchicalTaskTree: React.FC<HierarchicalTaskTreeProps> = ({ 
  tasks, 
  width = 900, 
  height = 600 
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const theme = useTheme();
  
  // Settings state
  const [layoutType, setLayoutType] = useState<LayoutType>('vertical');
  const [treeType, setTreeType] = useState<TreeType>('tree');
  const [showSettings, setShowSettings] = useState(false);
  const [nodeSize, setNodeSize] = useState(40);
  const [levelSeparation, setLevelSeparation] = useState(150);
  const [nodeSeparation, setNodeSeparation] = useState(120);
  const [showOrphans, setShowOrphans] = useState(true);
  
  // Calculate dependency levels and build tree structure
  const treeData = useMemo(() => {
    if (tasks.length === 0) return null;

    // Create task map for quick lookup
    const taskMap = new Map(tasks.map(task => [task.id, task]));
    
    // Calculate dependency levels
    const levels = new Map<string, number>();
    const visited = new Set<string>();
    const visiting = new Set<string>();
    
    const calculateLevel = (taskId: string): number => {
      if (levels.has(taskId)) return levels.get(taskId)!;
      if (visiting.has(taskId)) return 0; // Circular dependency detected
      
      visiting.add(taskId);
      const task = taskMap.get(taskId);
      
      if (!task || !task.depends || task.depends.length === 0) {
        levels.set(taskId, 0);
        visiting.delete(taskId);
        visited.add(taskId);
        return 0;
      }
      
      const maxDepLevel = Math.max(...task.depends.map(calculateLevel));
      const level = maxDepLevel + 1;
      levels.set(taskId, level);
      visiting.delete(taskId);
      visited.add(taskId);
      return level;
    };

    // Calculate levels for all tasks
    tasks.forEach(task => calculateLevel(task.id));

    // Group tasks by level
    const tasksByLevel = new Map<number, TaskDTO[]>();
    tasks.forEach(task => {
      const level = levels.get(task.id) || 0;
      if (!tasksByLevel.has(level)) {
        tasksByLevel.set(level, []);
      }
      tasksByLevel.get(level)!.push(task);
    });

    // Build hierarchical structure
    const buildHierarchy = (): TaskTreeData => {
      // Start with root level tasks (level 0)
      const rootTasks = tasksByLevel.get(0) || [];
      
      if (rootTasks.length === 0) {
        // No root tasks, create virtual root
        const allTasks = Array.from(tasksByLevel.values()).flat();
        return {
          id: 'virtual-root',
          title: 'All Tasks',
          status: 'PENDING',
          priority: 'NONE',
          level: -1,
          taskData: {} as TaskDTO,
          children: allTasks.map(task => createTaskNode(task, levels.get(task.id) || 0))
        };
      }

      if (rootTasks.length === 1 && !showOrphans) {
        // Single root task, start from there
        return createTaskNode(rootTasks[0], 0);
      }

      // Multiple root tasks, create virtual root
      return {
        id: 'virtual-root',
        title: 'Task Hierarchy',
        status: 'PENDING',
        priority: 'NONE',
        level: -1,
        taskData: {} as TaskDTO,
        children: rootTasks.map(task => createTaskNode(task, 0))
      };
    };

    const createTaskNode = (task: TaskDTO, level: number): TaskTreeData => {
      // Find direct dependents (tasks that depend on this task)
      const dependents = tasks.filter(t => 
        t.depends && t.depends.includes(task.id)
      );

      return {
        id: task.id,
        title: task.title,
        status: task.status,
        priority: task.priority,
        projectName: task.projectName,
        level,
        taskData: task,
        children: dependents.length > 0 
          ? dependents.map(dep => createTaskNode(dep, levels.get(dep.id) || 0))
          : undefined
      };
    };

    return buildHierarchy();
  }, [tasks, showOrphans]);

  // Create the tree visualization
  useEffect(() => {
    if (!svgRef.current || !treeData || tasks.length === 0) return;

    // Clear previous content
    d3.select(svgRef.current).selectAll('*').remove();

    const svg = d3.select(svgRef.current)
      .attr('width', width)
      .attr('height', height);

    // Create main group for zoom/pan
    const mainGroup = svg.append('g').attr('class', 'main-group');

    // Create hierarchy
    const hierarchy = d3.hierarchy(treeData);

    // Check if we have any children to actually create a tree
    if (!hierarchy.children || hierarchy.children.length === 0) {
      // Just show a single node
      const singleNode = svg.append('g')
        .attr('transform', `translate(${width/2}, ${height/2})`);
      
      singleNode.append('rect')
        .attr('width', 200)
        .attr('height', 40)
        .attr('x', -100)
        .attr('y', -20)
        .attr('rx', 6)
        .style('fill', theme.palette.action.hover)
        .style('stroke', theme.palette.divider)
        .style('stroke-width', 1);
        
      singleNode.append('text')
        .attr('text-anchor', 'middle')
        .attr('dy', '0.31em')
        .style('font-size', '14px')
        .style('fill', theme.palette.text.primary)
        .text('No task dependencies to display');
        
      return;
    }

    let layout: d3.TreeLayout<TaskTreeData> | d3.ClusterLayout<TaskTreeData>;
    
    // Choose layout algorithm
    if (treeType === 'cluster') {
      layout = d3.cluster<TaskTreeData>();
    } else {
      layout = d3.tree<TaskTreeData>();
    }

    // Configure layout based on orientation
    const margin = { top: 40, right: 40, bottom: 40, left: 40 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    if (layoutType === 'vertical') {
      layout.size([innerWidth, innerHeight]);
      layout.separation((a, b) => (a.parent === b.parent ? 1 : 1.2) * (nodeSeparation / 100));
    } else if (layoutType === 'horizontal') {
      layout.size([innerHeight, innerWidth]);
      layout.separation((a, b) => (a.parent === b.parent ? 1 : 1.2) * (nodeSeparation / 100));
    } else { // radial
      layout.size([2 * Math.PI, Math.min(innerWidth, innerHeight) / 2 - nodeSize]);
    }

    const treeNodes = layout(hierarchy);

    // Transform coordinates for different layouts
    const nodes = treeNodes.descendants().map(d => {
      let x, y;
      
      if (layoutType === 'vertical') {
        x = d.x + margin.left;
        y = d.y + margin.top;
      } else if (layoutType === 'horizontal') {
        x = d.y + margin.left;
        y = d.x + margin.top;
      } else { // radial
        const angle = d.x;
        const radius = d.y;
        x = Math.cos(angle - Math.PI / 2) * radius + width / 2;
        y = Math.sin(angle - Math.PI / 2) * radius + height / 2;
      }
      
      return { ...d, x, y };
    });

    const links = treeNodes.links().map(d => {
      // Find the corresponding nodes with coordinates
      const sourceNode = nodes.find(n => n.data === d.source.data);
      const targetNode = nodes.find(n => n.data === d.target.data);
      
      if (!sourceNode || !targetNode) {
        console.warn('Could not find source or target node for link');
        return null;
      }
      
      return { 
        source: { x: sourceNode.x!, y: sourceNode.y! }, 
        target: { x: targetNode.x!, y: targetNode.y! },
        sourceNode: d.source,
        targetNode: d.target
      };
    }).filter(Boolean); // Remove null links

    // Add zoom behavior
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.1, 3])
      .on('zoom', (event) => {
        mainGroup.attr('transform', event.transform);
      });

    svg.call(zoom);

    // Create links
    const linkGroup = mainGroup.append('g').attr('class', 'links');
    
    linkGroup.selectAll('.link')
      .data(links)
      .enter()
      .append('path')
      .attr('class', 'link')
      .attr('d', d => {
        if (layoutType === 'radial') {
          // For radial layout, use the source/target coordinates directly since they're already converted
          const sourceX = d.source.x;
          const sourceY = d.source.y;
          const targetX = d.target.x;
          const targetY = d.target.y;
          
          return `M${sourceX},${sourceY} L${targetX},${targetY}`;
        } else {
          const source = d.source;
          const target = d.target;
          
          if (layoutType === 'horizontal') {
            // Create curved horizontal links
            const midX = (source.x + target.x) / 2;
            return `M${source.x},${source.y} C${midX},${source.y} ${midX},${target.y} ${target.x},${target.y}`;
          } else {
            // Create curved vertical links
            const midY = (source.y + target.y) / 2;
            return `M${source.x},${source.y} C${source.x},${midY} ${target.x},${midY} ${target.x},${target.y}`;
          }
        }
      })
      .style('fill', 'none')
      .style('stroke', theme.palette.divider)
      .style('stroke-width', 2)
      .style('stroke-opacity', 0.6);

    // Create nodes
    const nodeGroup = mainGroup.append('g').attr('class', 'nodes');
    
    const node = nodeGroup.selectAll('.node')
      .data(nodes)
      .enter()
      .append('g')
      .attr('class', 'node')
      .attr('transform', d => `translate(${d.x},${d.y})`)
      .style('cursor', 'pointer');

    // Add node backgrounds
    node.append('rect')
      .attr('width', d => {
        // Dynamic width based on text length
        const textLength = d.data.title.length;
        return Math.max(nodeSize * 2, Math.min(textLength * 8 + 20, nodeSize * 4));
      })
      .attr('height', nodeSize)
      .attr('x', d => {
        const textLength = d.data.title.length;
        const width = Math.max(nodeSize * 2, Math.min(textLength * 8 + 20, nodeSize * 4));
        return -width / 2;
      })
      .attr('y', -nodeSize / 2)
      .attr('rx', 6)
      .attr('ry', 6)
      .style('fill', d => {
        if (d.data.id === 'virtual-root') return theme.palette.action.hover;
        
        // Color by status with priority border
        switch (d.data.status) {
          case 'COMPLETED': return theme.palette.success.light;
          case 'ACTIVE': return theme.palette.warning.light;
          case 'PENDING': return theme.palette.grey[200];
          default: return theme.palette.info.light;
        }
      })
      .style('stroke', d => {
        if (d.data.id === 'virtual-root') return theme.palette.action.disabled;
        const priorityConfig = getPriorityConfig(d.data.priority as any, theme);
        return priorityConfig.color;
      })
      .style('stroke-width', d => d.data.priority === 'HIGH' ? 3 : 1.5)
      .style('opacity', 0.9);

    // Add node text
    node.append('text')
      .attr('dy', '0.31em')
      .attr('text-anchor', 'middle')
      .style('font-size', '11px')
      .style('font-weight', '600')
      .style('fill', theme.palette.text.primary)
      .style('pointer-events', 'none')
      .text(d => {
        if (d.data.id === 'virtual-root') return d.data.title;
        // Truncate long titles
        return d.data.title.length > 20 ? d.data.title.substring(0, 17) + '...' : d.data.title;
      });

    // Add priority indicators
    node.filter(d => d.data.id !== 'virtual-root' && d.data.priority && d.data.priority !== 'NONE' && d.data.priority !== false)
      .append('circle')
      .attr('cx', d => {
        const textLength = d.data.title.length;
        const width = Math.max(nodeSize * 2, Math.min(textLength * 8 + 20, nodeSize * 4));
        return width / 2 - 8;
      })
      .attr('cy', -nodeSize / 2 + 8)
      .attr('r', 4)
      .style('fill', d => {
        const priorityConfig = getPriorityConfig(d.data.priority as any, theme);
        return priorityConfig.color;
      });

    // Add tooltips
    node.append('title')
      .text(d => {
        if (d.data.id === 'virtual-root') return 'Root Node';
        return `${d.data.title}\nStatus: ${d.data.status}\nPriority: ${d.data.priority}\nLevel: ${d.data.level}\nProject: ${d.data.projectName || 'None'}`;
      });

    // Add level indicators for debugging
    if (layoutType === 'vertical') {
      const levelGroup = mainGroup.append('g').attr('class', 'levels');
      
      const levels = Array.from(new Set(nodes.map(d => d.data.level))).sort((a, b) => a - b);
      
      levelGroup.selectAll('.level-line')
        .data(levels.filter(l => l >= 0))
        .enter()
        .append('line')
        .attr('class', 'level-line')
        .attr('x1', margin.left)
        .attr('x2', width - margin.right)
        .attr('y1', d => margin.top + d * levelSeparation)
        .attr('y2', d => margin.top + d * levelSeparation)
        .style('stroke', theme.palette.action.disabled)
        .style('stroke-width', 1)
        .style('stroke-dasharray', '3,3')
        .style('opacity', 0.3);

      levelGroup.selectAll('.level-label')
        .data(levels.filter(l => l >= 0))
        .enter()
        .append('text')
        .attr('class', 'level-label')
        .attr('x', margin.left - 10)
        .attr('y', d => margin.top + d * levelSeparation)
        .attr('dy', '0.31em')
        .style('font-size', '10px')
        .style('fill', theme.palette.text.secondary)
        .style('text-anchor', 'end')
        .text(d => `L${d}`);
    }

    return () => {
      // Cleanup
    };
  }, [treeData, layoutType, treeType, nodeSize, levelSeparation, nodeSeparation, width, height, theme]);

  const handleLayoutChange = useCallback((_: React.MouseEvent<HTMLElement>, newLayout: LayoutType) => {
    if (newLayout !== null) {
      setLayoutType(newLayout);
    }
  }, []);

  const handleTreeTypeChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    setTreeType(event.target.checked ? 'cluster' : 'tree');
  }, []);

  if (!treeData) {
    return (
      <Paper sx={{ p: 3, textAlign: 'center' }}>
        <Typography variant="body1" color="text.secondary">
          No tasks available for hierarchy visualization
        </Typography>
      </Paper>
    );
  }

  const totalNodes = tasks.length;
  const maxLevel = Math.max(...Array.from(tasks.map(task => {
    // Calculate level for each task (simplified)
    const calculateDepth = (taskId: string, visited = new Set()): number => {
      if (visited.has(taskId)) return 0;
      visited.add(taskId);
      const task = tasks.find(t => t.id === taskId);
      if (!task?.depends?.length) return 0;
      return 1 + Math.max(...task.depends.map(depId => calculateDepth(depId, visited)));
    };
    return calculateDepth(task.id);
  })));

  return (
    <Paper sx={{ p: 2, height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header with Controls */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Box>
          <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <AccountTree />
            Hierarchical Task Tree
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {totalNodes} tasks across {maxLevel + 1} levels
          </Typography>
        </Box>
        
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          {/* Layout Type Toggle */}
          <ToggleButtonGroup
            value={layoutType}
            exclusive
            onChange={handleLayoutChange}
            size="small"
          >
            <ToggleButton value="vertical">
              <Tooltip title="Vertical Tree">
                <ViewList />
              </Tooltip>
            </ToggleButton>
            <ToggleButton value="horizontal">
              <Tooltip title="Horizontal Tree">
                <Timeline />
              </Tooltip>
            </ToggleButton>
            <ToggleButton value="radial">
              <Tooltip title="Radial Tree">
                <RadioButtonUnchecked />
              </Tooltip>
            </ToggleButton>
          </ToggleButtonGroup>

          {/* Tree vs Cluster Toggle */}
          <FormControlLabel
            control={
              <Switch
                checked={treeType === 'cluster'}
                onChange={handleTreeTypeChange}
                size="small"
              />
            }
            label="Cluster"
            sx={{ ml: 1 }}
          />

          {/* Settings Toggle */}
          <IconButton
            onClick={() => setShowSettings(!showSettings)}
            size="small"
            title="Tree Settings"
          >
            {showSettings ? <ExpandLess /> : <ExpandMore />}
          </IconButton>
        </Box>
      </Box>

      {/* Settings Panel */}
      <Collapse in={showSettings}>
        <Box sx={{ 
          mb: 2, 
          p: 2, 
          border: `1px solid ${theme.palette.divider}`, 
          borderRadius: 1,
          backgroundColor: theme.palette.background.default
        }}>
          <Typography variant="subtitle2" gutterBottom>
            Tree Layout Settings
          </Typography>
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 3 }}>
            <Box>
              <Typography variant="caption" gutterBottom>
                Node Size: {nodeSize}px
              </Typography>
              <Slider
                value={nodeSize}
                onChange={(_, value) => setNodeSize(value as number)}
                min={25}
                max={80}
                step={5}
                size="small"
              />
            </Box>
            
            <Box>
              <Typography variant="caption" gutterBottom>
                Level Separation: {levelSeparation}px
              </Typography>
              <Slider
                value={levelSeparation}
                onChange={(_, value) => setLevelSeparation(value as number)}
                min={80}
                max={300}
                step={10}
                size="small"
              />
            </Box>
            
            <Box>
              <Typography variant="caption" gutterBottom>
                Node Separation: {nodeSeparation}%
              </Typography>
              <Slider
                value={nodeSeparation}
                onChange={(_, value) => setNodeSeparation(value as number)}
                min={50}
                max={200}
                step={10}
                size="small"
              />
            </Box>
            
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={showOrphans}
                    onChange={(e) => setShowOrphans(e.target.checked)}
                    size="small"
                  />
                }
                label="Show Orphan Tasks"
              />
            </Box>
          </Box>
        </Box>
      </Collapse>

      {/* Tree Statistics */}
      <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap' }}>
        <Chip
          label={`${totalNodes} Total Tasks`}
          color="primary"
          size="small"
        />
        <Chip
          label={`${maxLevel + 1} Dependency Levels`}
          color="secondary"
          size="small"
        />
        <Chip
          label={`Layout: ${layoutType}`}
          variant="outlined"
          size="small"
        />
        <Chip
          label={`Type: ${treeType}`}
          variant="outlined"
          size="small"
        />
      </Box>

      {/* SVG Container */}
      <Box sx={{ flex: 1, overflow: 'hidden', border: `1px solid ${theme.palette.divider}`, borderRadius: 1 }}>
        <svg 
          ref={svgRef} 
          style={{ 
            width: '100%', 
            height: '100%', 
            display: 'block',
            backgroundColor: theme.palette.background.paper
          }} 
        />
      </Box>

      {/* Legend */}
      <Box sx={{ mt: 2, display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
        <Typography variant="caption" color="text.secondary">
          Legend:
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Box sx={{ width: 12, height: 12, bgcolor: 'success.light', borderRadius: 0.5 }} />
          <Typography variant="caption">Completed</Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Box sx={{ width: 12, height: 12, bgcolor: 'warning.light', borderRadius: 0.5 }} />
          <Typography variant="caption">Active</Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Box sx={{ width: 12, height: 12, bgcolor: 'grey.200', borderRadius: 0.5 }} />
          <Typography variant="caption">Pending</Typography>
        </Box>
        <Typography variant="caption" color="text.secondary">
          • Border thickness = Priority • Dot = High Priority • Drag to pan, wheel to zoom
        </Typography>
      </Box>
    </Paper>
  );
};

export default HierarchicalTaskTree;