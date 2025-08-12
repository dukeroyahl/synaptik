import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import { Box, Typography, Paper, useTheme, FormControlLabel, Switch, Chip, IconButton, ButtonGroup, Slider, Collapse } from '@mui/material';
import { ZoomIn, ZoomOut, CenterFocusStrong, Settings, ExpandMore, ExpandLess } from '@mui/icons-material';
import * as d3 from 'd3';
import { TaskDTO } from '../types';
import { getPriorityConfig } from '../utils/priorityUtils';

interface ForceDirectedTaskGraphProps {
  tasks: TaskDTO[];
  width?: number;
  height?: number;
}

interface GraphNode extends d3.SimulationNodeDatum {
  id: string;
  title: string;
  status: string;
  priority: string;
  project: string | null;
  dependencyCount: number;
  dependentCount: number;
  cluster?: number;
}

interface GraphLink extends d3.SimulationLinkDatum<GraphNode> {
  source: string | GraphNode;
  target: string | GraphNode;
}

const ForceDirectedTaskGraph: React.FC<ForceDirectedTaskGraphProps> = ({ 
  tasks, 
  width = 800, 
  height = 600 
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const theme = useTheme();
  const [clusterByProject, setClusterByProject] = useState(true);
  const [simulation, setSimulation] = useState<d3.Simulation<GraphNode, GraphLink> | null>(null);
  const [linkDistance, setLinkDistance] = useState(60); // Reduced from 100
  const [chargeStrength, setChargeStrength] = useState(-200); // Reduced from -300
  const [boundaryStrength, setBoundaryStrength] = useState(0.1); // New boundary force strength
  const [showSettings, setShowSettings] = useState(false);

  // Memoize projects and color scale to prevent recreation on every render
  const projects = useMemo(() => 
    Array.from(new Set(tasks.map(task => task.projectName).filter(Boolean))), 
    [tasks]
  );
  
  const projectClusterMap = useMemo(() => 
    new Map(projects.map((project, index) => [project, index])), 
    [projects]
  );

  const projectColorScale = useMemo(() => d3.scaleOrdinal(d3.schemeCategory10), []);

  // Memoize the graph data to prevent recreation
  const graphData = useMemo(() => {
    // Helper function to get tasks that depend on a given task
    const getTasksDependingOn = (taskId: string) => {
      return tasks.filter(task => task.depends && task.depends.includes(taskId));
    };

    // Prepare nodes - include all tasks
    const nodes: GraphNode[] = tasks.map(task => {
      const dependencyCount = task.depends ? task.depends.length : 0;
      const dependentCount = getTasksDependingOn(task.id).length;
      
      return {
        id: task.id,
        title: task.title,
        status: task.status,
        priority: task.priority,
        project: task.projectName || null,
        dependencyCount,
        dependentCount,
        cluster: task.projectName ? projectClusterMap.get(task.projectName) : undefined
      };
    });

    // Prepare links - only between tasks that have dependencies
    const links: GraphLink[] = [];
    tasks.forEach(task => {
      if (task.depends) {
        task.depends.forEach(depId => {
          // Only add link if both tasks exist in our node set
          if (nodes.find(n => n.id === depId)) {
            links.push({
              source: depId,
              target: task.id
            });
          }
        });
      }
    });

    return { nodes, links };
  }, [tasks, projectClusterMap]);

  // Custom clustering force function - memoized to prevent recreation
  const forceCluster = useCallback(() => {
    const strength = 0.1;
    let nodes: GraphNode[];

    function force(alpha: number) {
      const centroids = new Map<string, { x: number; y: number; count: number }>();
      
      // Calculate centroids for each project
      nodes.forEach(node => {
        if (node.project) {
          const centroid = centroids.get(node.project) || { x: 0, y: 0, count: 0 };
          centroid.x += node.x!;
          centroid.y += node.y!;
          centroid.count += 1;
          centroids.set(node.project, centroid);
        }
      });

      // Normalize centroids
      centroids.forEach(centroid => {
        centroid.x /= centroid.count;
        centroid.y /= centroid.count;
      });

      // Apply clustering force
      nodes.forEach(node => {
        if (node.project) {
          const centroid = centroids.get(node.project);
          if (centroid) {
            const dx = centroid.x - node.x!;
            const dy = centroid.y - node.y!;
            node.vx! += dx * strength * alpha;
            node.vy! += dy * strength * alpha;
          }
        }
      });
    }

    force.initialize = function(_nodes: GraphNode[]) {
      nodes = _nodes;
    };

    return force;
  }, []);

  // Create the graph - simplified without complex zoom initialization
  useEffect(() => {
    if (!svgRef.current || tasks.length === 0) return;

    // Clear previous graph
    d3.select(svgRef.current).selectAll('*').remove();

    const { nodes, links } = graphData;

    // Set up SVG
    const svg = d3.select(svgRef.current)
      .attr('width', width)
      .attr('height', height);

    // Create main group for zoom/pan
    const mainGroup = svg.append('g').attr('class', 'main-group');

    // Create groups for different layers within the main group
    const linkGroup = mainGroup.append('g').attr('class', 'links');
    const clusterGroup = mainGroup.append('g').attr('class', 'clusters');
    const nodeGroup = mainGroup.append('g').attr('class', 'nodes');

    // Text wrapping configuration
    const maxWidth = 120; // Maximum box width
    const fontSize = 10;
    const lineHeight = 12;
    const textPadding = 8;

    // Function to wrap text
    const wrapText = (text: string, maxWidth: number): string[] => {
      const words = text.split(' ');
      const lines: string[] = [];
      let currentLine = '';

      // Create temporary text element to measure width
      const tempText = svg.append('text')
        .style('font-size', `${fontSize}px`)
        .style('font-weight', 'bold')
        .style('visibility', 'hidden');

      for (const word of words) {
        const testLine = currentLine ? `${currentLine} ${word}` : word;
        tempText.text(testLine);
        const textWidth = tempText.node()!.getBBox().width;

        if (textWidth > maxWidth - textPadding * 2 && currentLine) {
          lines.push(currentLine);
          currentLine = word;
        } else {
          currentLine = testLine;
        }
      }
      
      if (currentLine) {
        lines.push(currentLine);
      }

      tempText.remove();
      return lines;
    };

    // Calculate text dimensions for each node with wrapping
    const nodeData = nodes.map(d => {
      const lines = wrapText(d.title, maxWidth);
      const width = Math.min(maxWidth, Math.max(60, lines.reduce((max, line) => {
        // Approximate width calculation
        return Math.max(max, line.length * 6 + textPadding * 2);
      }, 0)));
      const height = lines.length * lineHeight + textPadding * 2;
      
      return {
        node: d,
        lines,
        width,
        height
      };
    });

    // Simple zoom behavior - add later if needed
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.1, 4])
      .on('zoom', (event) => {
        mainGroup.attr('transform', event.transform);
      });

    // Apply zoom - but don't let it break the component
    svg.call(zoom);

    // Calculate collision radius based on actual node dimensions
    const getNodeRadius = (d: GraphNode, i: number) => {
      const data = nodeData[i];
      return Math.max(data.width, data.height) / 2 + 5; // Add padding
    };

    // Custom boundary force to keep nodes within SVG bounds
    const boundaryForce = () => {
      let nodes: GraphNode[];
      const padding = 50; // Padding from edges

      function force() {
        nodes.forEach((node, i) => {
          const nodeRadius = getNodeRadius(node, i);
          const minX = nodeRadius + padding;
          const maxX = width - nodeRadius - padding;
          const minY = nodeRadius + padding;
          const maxY = height - nodeRadius - padding;

          // Apply boundary constraints
          if (node.x! < minX) {
            node.x = minX;
            node.vx = Math.max(0, node.vx!); // Stop leftward velocity
          }
          if (node.x! > maxX) {
            node.x = maxX;
            node.vx = Math.min(0, node.vx!); // Stop rightward velocity
          }
          if (node.y! < minY) {
            node.y = minY;
            node.vy = Math.max(0, node.vy!); // Stop upward velocity
          }
          if (node.y! > maxY) {
            node.y = maxY;
            node.vy = Math.min(0, node.vy!); // Stop downward velocity
          }
        });
      }

      force.initialize = function(_nodes: GraphNode[]) {
        nodes = _nodes;
      };

      return force;
    };

    // Create force simulation with boundary constraints
    const newSimulation = d3.forceSimulation<GraphNode>(nodes)
      .force('link', d3.forceLink<GraphNode, GraphLink>(links).id(d => d.id).distance(linkDistance))
      .force('charge', d3.forceManyBody().strength(chargeStrength))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide().radius((d, i) => getNodeRadius(d as GraphNode, i)))
      // Add boundary forces to keep nodes within the SVG bounds
      .force('x', d3.forceX(width / 2).strength(boundaryStrength))
      .force('y', d3.forceY(height / 2).strength(boundaryStrength))
      .force('boundary', boundaryForce());

    // Add clustering force if enabled
    if (clusterByProject) {
      newSimulation.force('cluster', forceCluster());
    } else {
      newSimulation.force('cluster', null);
    }

    // Create cluster backgrounds (if clustering is enabled)
    if (clusterByProject) {
      clusterGroup.selectAll('.cluster')
        .data(projects)
        .enter().append('circle')
        .attr('class', 'cluster')
        .attr('r', 80)
        .style('fill', d => projectColorScale(d))
        .style('fill-opacity', 0.1)
        .style('stroke', d => projectColorScale(d))
        .style('stroke-width', 2)
        .style('stroke-opacity', 0.3);
    }

    // Create links
    const link = linkGroup.selectAll('.link')
      .data(links)
      .enter().append('line')
      .attr('class', 'link')
      .style('stroke', theme.palette.divider)
      .style('stroke-width', 2)
      .style('stroke-opacity', 0.6)
      .attr('marker-end', 'url(#arrowhead)');

    // Add arrowhead marker
    svg.append('defs').append('marker')
      .attr('id', 'arrowhead')
      .attr('viewBox', '-0 -5 10 10')
      .attr('refX', 15) // Reduced from 25 to account for rectangular shape
      .attr('refY', 0)
      .attr('orient', 'auto')
      .attr('markerWidth', 8)
      .attr('markerHeight', 8)
      .attr('xoverflow', 'visible')
      .append('svg:path')
      .attr('d', 'M 0,-5 L 10 ,0 L 0,5')
      .attr('fill', theme.palette.divider)
      .style('stroke', 'none');

    // Create nodes
    const node = nodeGroup.selectAll('.node')
      .data(nodes)
      .enter().append('g')
      .attr('class', 'node')
      .style('cursor', 'grab')
      .call(d3.drag<SVGGElement, GraphNode>()
        .on('start', dragstarted)
        .on('drag', dragged)
        .on('end', dragended));

    // Add rectangles for nodes
    node.append('rect')
      .attr('width', (d, i) => nodeData[i].width)
      .attr('height', (d, i) => nodeData[i].height)
      .attr('x', (d, i) => -nodeData[i].width / 2)
      .attr('y', (d, i) => -nodeData[i].height / 2)
      .attr('rx', 4) // Rounded corners
      .attr('ry', 4)
      .style('fill', d => {
        if (clusterByProject && d.project) {
          return projectColorScale(d.project);
        }
        // Color by status
        switch (d.status) {
          case 'COMPLETED': return theme.palette.success.main;
          case 'ACTIVE': return theme.palette.warning.main;
          case 'PENDING': return theme.palette.grey[400];
          default: return theme.palette.info.main;
        }
      })
      .style('stroke', d => {
        const priorityConfig = getPriorityConfig(d.priority as any, theme);
        return priorityConfig.color;
      })
      .style('stroke-width', d => d.priority === 'HIGH' ? 3 : 1)
      .style('fill-opacity', 0.8);

    // Add multi-line text labels
    node.each(function(d, i) {
      const nodeGroup = d3.select(this);
      const data = nodeData[i];
      const startY = -(data.lines.length - 1) * lineHeight / 2;

      data.lines.forEach((line, lineIndex) => {
        nodeGroup.append('text')
          .text(line)
          .attr('y', startY + lineIndex * lineHeight)
          .style('font-size', `${fontSize}px`)
          .style('font-weight', 'bold')
          .style('fill', theme.palette.text.primary)
          .style('text-anchor', 'middle')
          .style('dominant-baseline', 'central')
          .style('pointer-events', 'none');
      });
    });

    // Add tooltips
    node.append('title')
      .text(d => `${d.title}\nStatus: ${d.status}\nPriority: ${d.priority}\nProject: ${d.project || 'None'}\nDependencies: ${d.dependencyCount}\nDependents: ${d.dependentCount}`);

    // Update positions on simulation tick
    newSimulation.on('tick', () => {
      link
        .attr('x1', d => (d.source as GraphNode).x!)
        .attr('y1', d => (d.source as GraphNode).y!)
        .attr('x2', d => (d.target as GraphNode).x!)
        .attr('y2', d => (d.target as GraphNode).y!);

      node
        .attr('transform', d => `translate(${d.x},${d.y})`);

      // Update cluster positions if clustering is enabled
      if (clusterByProject) {
        clusterGroup.selectAll('.cluster')
          .attr('cx', (d: string) => {
            const projectNodes = nodes.filter(n => n.project === d);
            return d3.mean(projectNodes, n => n.x!) || width / 2;
          })
          .attr('cy', (d: string) => {
            const projectNodes = nodes.filter(n => n.project === d);
            return d3.mean(projectNodes, n => n.y!) || height / 2;
          });
      }
    });

    // Drag functions
    function dragstarted(event: d3.D3DragEvent<SVGGElement, GraphNode, GraphNode>, d: GraphNode) {
      if (!event.active) newSimulation.alphaTarget(0.3).restart();
      d.fx = d.x;
      d.fy = d.y;
      d3.select(event.sourceEvent.target).style('cursor', 'grabbing');
    }

    function dragged(event: d3.D3DragEvent<SVGGElement, GraphNode, GraphNode>, d: GraphNode) {
      d.fx = event.x;
      d.fy = event.y;
    }

    function dragended(event: d3.D3DragEvent<SVGGElement, GraphNode, GraphNode>, d: GraphNode) {
      if (!event.active) newSimulation.alphaTarget(0);
      d.fx = null;
      d.fy = null;
      d3.select(event.sourceEvent.target).style('cursor', 'grab');
    }

    // Store simulation reference
    setSimulation(newSimulation);

    return () => {
      newSimulation.stop();
    };
  }, [graphData, width, height, clusterByProject, theme, projects, projectColorScale, forceCluster, linkDistance, chargeStrength]);

  // Handle clustering toggle
  const handleClusterToggle = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    setClusterByProject(event.target.checked);
  }, []);

  // Update simulation forces when parameters change
  useEffect(() => {
    if (simulation) {
      simulation
        .force('link', d3.forceLink<GraphNode, GraphLink>().id(d => d.id).distance(linkDistance))
        .force('charge', d3.forceManyBody().strength(chargeStrength))
        .force('x', d3.forceX(width / 2).strength(boundaryStrength))
        .force('y', d3.forceY(height / 2).strength(boundaryStrength))
        .alpha(0.3)
        .restart();
    }
  }, [simulation, linkDistance, chargeStrength, boundaryStrength, width, height]);

  return (
    <Paper sx={{ p: 2, height: '100%', display: 'flex', flexDirection: 'column', position: 'relative' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">Task Dependency Graph</Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <FormControlLabel
            control={
              <Switch
                checked={clusterByProject}
                onChange={handleClusterToggle}
                color="primary"
              />
            }
            label="Cluster by Project"
          />
          <IconButton
            onClick={() => setShowSettings(!showSettings)}
            size="small"
            title="Graph Settings"
          >
            <Settings fontSize="small" />
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
            Force Parameters
          </Typography>
          <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
            <Box sx={{ minWidth: 200 }}>
              <Typography variant="caption" gutterBottom>
                Link Distance: {linkDistance}px (closer = {linkDistance < 60 ? 'tighter' : linkDistance > 100 ? 'looser' : 'normal'})
              </Typography>
              <Slider
                value={linkDistance}
                onChange={(_, value) => setLinkDistance(value as number)}
                min={20}
                max={150}
                step={10}
                size="small"
                marks={[
                  { value: 20, label: <span style={{ fontSize: '10px' }}>Very Close</span> },
                  { value: 60, label: <span style={{ fontSize: '10px' }}>Close</span> },
                  { value: 100, label: <span style={{ fontSize: '10px' }}>Normal</span> },
                  { value: 150, label: <span style={{ fontSize: '10px' }}>Far</span> }
                ]}
              />
            </Box>
            <Box sx={{ minWidth: 200 }}>
              <Typography variant="caption" gutterBottom>
                Node Repulsion: {Math.abs(chargeStrength)} ({Math.abs(chargeStrength) > 300 ? 'strong' : Math.abs(chargeStrength) < 150 ? 'weak' : 'normal'})
              </Typography>
              <Slider
                value={Math.abs(chargeStrength)}
                onChange={(_, value) => setChargeStrength(-(value as number))}
                min={50}
                max={500}
                step={25}
                size="small"
                marks={[
                  { value: 50, label: <span style={{ fontSize: '10px' }}>Weak</span> },
                  { value: 200, label: <span style={{ fontSize: '10px' }}>Normal</span> },
                  { value: 350, label: <span style={{ fontSize: '10px' }}>Strong</span> }
                ]}
              />
            </Box>
            <Box sx={{ minWidth: 200 }}>
              <Typography variant="caption" gutterBottom>
                Boundary Constraint: {boundaryStrength} ({boundaryStrength > 0.2 ? 'strong' : boundaryStrength < 0.05 ? 'weak' : 'normal'})
              </Typography>
              <Slider
                value={boundaryStrength}
                onChange={(_, value) => setBoundaryStrength(value as number)}
                min={0}
                max={0.5}
                step={0.05}
                size="small"
                marks={[
                  { value: 0, label: <span style={{ fontSize: '10px' }}>None</span> },
                  { value: 0.1, label: <span style={{ fontSize: '10px' }}>Normal</span> },
                  { value: 0.3, label: <span style={{ fontSize: '10px' }}>Strong</span> }
                ]}
              />
            </Box>
          </Box>
          <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
            💡 Tip: Lower link distance brings nodes closer together. Higher repulsion spreads them apart. Boundary constraint prevents nodes from floating away.
          </Typography>
        </Box>
      </Collapse>
      
      {/* Project legend */}
      {clusterByProject && projects.length > 0 && (
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
          {projects.map(project => (
            <Chip
              key={project}
              label={project}
              size="small"
              sx={{
                backgroundColor: projectColorScale(project),
                color: theme.palette.getContrastText(projectColorScale(project)),
              }}
            />
          ))}
        </Box>
      )}

      <Box sx={{ flex: 1, overflow: 'hidden', width: '100%' }}>
        {tasks.length === 0 ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
            <Typography variant="body2" color="text.secondary">
              No tasks to display
            </Typography>
          </Box>
        ) : (
          <svg ref={svgRef} style={{ width: '100%', height: '100%', display: 'block' }} />
        )}
      </Box>
      
      <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
        Box size adapts to task title length. Border thickness indicates priority. Drag nodes to reposition. Use mouse wheel to zoom.
      </Typography>
    </Paper>
  );
};

export default ForceDirectedTaskGraph;
