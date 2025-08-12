import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import { Box, Typography, Paper, useTheme, FormControlLabel, Switch, Slider, Collapse, IconButton, ButtonGroup } from '@mui/material';
import { Settings, ZoomIn, ZoomOut, CenterFocusStrong } from '@mui/icons-material';
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
  width: baseWidth = 800, 
  height: baseHeight = 600 
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const theme = useTheme();
  const [clusterByProject, setClusterByProject] = useState(true);
  const [simulation, setSimulation] = useState<d3.Simulation<GraphNode, GraphLink> | null>(null);
  const [linkDistance, setLinkDistance] = useState(200); // Increased from 150 to 200
  const [chargeStrength, setChargeStrength] = useState(-800); // Increased from -600 to -800 (stronger repulsion)
  const [boundaryStrength, setBoundaryStrength] = useState(0.005); // Reduced from 0.01 to allow more spreading
  const [showProjectContainers, setShowProjectContainers] = useState(true);
  const [showSettings, setShowSettings] = useState(false);

  // Memoize projects and color scale
  const projects = useMemo(() => 
    Array.from(new Set(tasks.map(task => task.projectName).filter(Boolean))), 
    [tasks]
  );

  // Calculate dynamic dimensions based on number of projects
  const { width, height } = useMemo(() => {
    if (!clusterByProject || projects.length === 0) {
      return { width: baseWidth, height: baseHeight };
    }

    const projectCount = projects.length;
    const cols = Math.ceil(Math.sqrt(projectCount));
    const rows = Math.ceil(projectCount / cols);
    
    // Reduced container size per project for tighter fit
    const minContainerWidth = 250;  // Reduced for tighter fit
    const minContainerHeight = 200; // Reduced for tighter fit
    const spacing = 80; // Reduced spacing
    
    // Calculate required dimensions
    const requiredWidth = Math.max(
      baseWidth,
      cols * minContainerWidth + (cols + 1) * spacing
    );
    
    const requiredHeight = Math.max(
      baseHeight,
      rows * minContainerHeight + (rows + 1) * spacing
    );

    return {
      width: requiredWidth,
      height: requiredHeight
    };
  }, [baseWidth, baseHeight, clusterByProject, projects.length]);
  
  const projectClusterMap = useMemo(() => 
    new Map(projects.map((project, index) => [project, index])), 
    [projects]
  );

  const projectColorScale = useMemo(() => 
    d3.scaleOrdinal(d3.schemeCategory10).domain(projects), 
    [projects]
  );

  // Simple project clustering force
  const forceProjectClustering = useCallback(() => {
    let nodes: GraphNode[];

    function force(alpha: number) {
      if (!clusterByProject) return;

      // Group nodes by project
      const projectGroups = new Map<string, GraphNode[]>();
      nodes.forEach(node => {
        if (node.project) {
          if (!projectGroups.has(node.project)) {
            projectGroups.set(node.project, []);
          }
          projectGroups.get(node.project)!.push(node);
        }
      });

      // Apply clustering within projects and separation between projects
      projectGroups.forEach((projectNodes, projectName) => {
        // Calculate project centroid
        let centerX = 0, centerY = 0;
        projectNodes.forEach(node => {
          centerX += node.x!;
          centerY += node.y!;
        });
        centerX /= projectNodes.length;
        centerY /= projectNodes.length;

        // Apply gentle clustering force within project
        projectNodes.forEach(node => {
          const dx = centerX - node.x!;
          const dy = centerY - node.y!;
          const distance = Math.sqrt(dx * dx + dy * dy);
          
          if (distance > 0) {
            const clusterStrength = 0.08; // Reduced from 0.1 to allow more spreading within projects
            node.vx! += (dx / distance) * clusterStrength * alpha;
            node.vy! += (dy / distance) * clusterStrength * alpha;
          }
        });
      });

      // Apply separation between different projects
      const projectCentroids = Array.from(projectGroups.entries()).map(([name, nodes]) => {
        let centerX = 0, centerY = 0;
        nodes.forEach(node => {
          centerX += node.x!;
          centerY += node.y!;
        });
        return {
          name,
          nodes,
          centerX: centerX / nodes.length,
          centerY: centerY / nodes.length
        };
      });

      // Separate project centroids with increased minimum distance
      for (let i = 0; i < projectCentroids.length; i++) {
        for (let j = i + 1; j < projectCentroids.length; j++) {
          const projectA = projectCentroids[i];
          const projectB = projectCentroids[j];

          const dx = projectB.centerX - projectA.centerX;
          const dy = projectB.centerY - projectA.centerY;
          const distance = Math.sqrt(dx * dx + dy * dy);
          const minDistance = 300; // Increased from 200 to 300 for more project separation

          if (distance < minDistance && distance > 0) {
            const separationForce = (minDistance - distance) * 0.15 * alpha; // Increased from 0.1 to 0.15
            const unitX = dx / distance;
            const unitY = dy / distance;

            // Apply separation to all nodes in each project
            projectA.nodes.forEach(node => {
              node.vx! -= unitX * separationForce / projectA.nodes.length;
              node.vy! -= unitY * separationForce / projectA.nodes.length;
            });

            projectB.nodes.forEach(node => {
              node.vx! += unitX * separationForce / projectB.nodes.length;
              node.vy! += unitY * separationForce / projectB.nodes.length;
            });
          }
        }
      }
    }

    force.initialize = function(_nodes: GraphNode[]) {
      nodes = _nodes;
    };

    return force;
  }, [clusterByProject]);

  // Prepare graph data
  const graphData = useMemo(() => {
    const getTasksDependingOn = (taskId: string) => {
      return tasks.filter(task => task.depends && task.depends.includes(taskId));
    };

    // Prepare nodes with initial positioning
    const nodes: GraphNode[] = tasks.map((task, index) => {
      const dependencyCount = task.depends ? task.depends.length : 0;
      const dependentCount = getTasksDependingOn(task.id).length;
      
      // Initial positioning for better clustering
      let initialX = width / 2;
      let initialY = height / 2;
      
      if (task.projectName && clusterByProject) {
        const projectIndex = projectClusterMap.get(task.projectName) || 0;
        const projectCount = projects.length;
        const cols = Math.ceil(Math.sqrt(projectCount));
        const rows = Math.ceil(projectCount / cols);
        const col = projectIndex % cols;
        const row = Math.floor(projectIndex / cols);
        
        // Calculate spacing based on reduced dynamic dimensions
        const containerWidth = 250;  // Reduced from 400px
        const containerHeight = 200; // Reduced from 300px
        const spacingX = 80;         // Reduced from 120px
        const spacingY = 80;         // Reduced from 120px
        
        // Calculate total grid dimensions
        const totalGridWidth = cols * containerWidth + (cols - 1) * spacingX;
        const totalGridHeight = rows * containerHeight + (rows - 1) * spacingY;
        
        // Center the grid within the available space
        const gridStartX = (width - totalGridWidth) / 2 + containerWidth / 2;
        const gridStartY = (height - totalGridHeight) / 2 + containerHeight / 2;
        
        initialX = gridStartX + col * (containerWidth + spacingX);
        initialY = gridStartY + row * (containerHeight + spacingY);
        
        // Add small randomization within the project area
        initialX += (Math.random() - 0.5) * 50;
        initialY += (Math.random() - 0.5) * 50;
      }
      
      return {
        id: task.id,
        title: task.title,
        status: task.status,
        priority: task.priority,
        project: task.projectName || null,
        dependencyCount,
        dependentCount,
        cluster: task.projectName ? projectClusterMap.get(task.projectName) : undefined,
        x: initialX,
        y: initialY
      };
    });

    // Prepare links
    const links: GraphLink[] = [];
    tasks.forEach(task => {
      if (task.depends) {
        task.depends.forEach(depId => {
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
  }, [tasks, projectClusterMap, clusterByProject, width, height, projects]);

  // Handle clustering toggle
  const handleClusterToggle = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    setClusterByProject(event.target.checked);
  }, []);

  // Create the graph
  useEffect(() => {
    if (!svgRef.current || tasks.length === 0) return;

    d3.select(svgRef.current).selectAll('*').remove();

    const { nodes, links } = graphData;

    const svg = d3.select(svgRef.current)
      .attr('width', width)
      .attr('height', height);

    const mainGroup = svg.append('g').attr('class', 'main-group');
    const linkGroup = mainGroup.append('g').attr('class', 'links');
    const clusterGroup = mainGroup.append('g').attr('class', 'clusters');
    const nodeGroup = mainGroup.append('g').attr('class', 'nodes');

    // Text wrapping configuration
    const maxWidth = 140;
    const fontSize = 10;
    const lineHeight = 12;
    const textPadding = 8;

    const wrapText = (text: string, maxWidth: number): string[] => {
      const words = text.split(' ');
      const lines: string[] = [];
      let currentLine = '';

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

    const nodeData = nodes.map(d => {
      const lines = wrapText(d.title, maxWidth);
      const width = Math.min(maxWidth, Math.max(80, lines.reduce((max, line) => {
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

    // Simple function to calculate project boundary for display
    const calculateProjectBoundary = (projectName: string) => {
      const projectNodes = nodes.filter(n => n.project === projectName);
      if (projectNodes.length === 0) return null;

      let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
      
      projectNodes.forEach(node => {
        const nodeIndex = nodes.findIndex(n => n.id === node.id);
        const data = nodeData[nodeIndex];
        if (data) {
          const nodeLeft = (node.x || 0) - data.width / 2;
          const nodeRight = (node.x || 0) + data.width / 2;
          const nodeTop = (node.y || 0) - data.height / 2;
          const nodeBottom = (node.y || 0) + data.height / 2;
          
          minX = Math.min(minX, nodeLeft);
          maxX = Math.max(maxX, nodeRight);
          minY = Math.min(minY, nodeTop);
          maxY = Math.max(maxY, nodeBottom);
        }
      });

      const padding = 40;
      const headerHeight = 35;
      const rectWidth = Math.max(maxX - minX + padding * 2, 200);
      const rectHeight = Math.max(maxY - minY + padding * 2 + headerHeight, 150);
      const centerX = (minX + maxX) / 2;
      const centerY = (minY + maxY) / 2;

      return {
        x: centerX - rectWidth / 2,
        y: centerY - rectHeight / 2 - headerHeight / 2,
        width: rectWidth,
        height: rectHeight,
        centerX: centerX,
        centerY: centerY
      };
    };

    // Add enhanced arrowhead markers
    const defs = svg.append('defs');
    
    defs.append('marker')
      .attr('id', 'arrowhead-large')
      .attr('viewBox', '0 -8 12 16')
      .attr('refX', 10)
      .attr('refY', 0)
      .attr('markerWidth', 8)
      .attr('markerHeight', 8)
      .attr('orient', 'auto')
      .append('path')
      .attr('d', 'M0,-8L12,0L0,8')
      .style('fill', theme.palette.primary.main);

    defs.append('marker')
      .attr('id', 'arrowhead-medium')
      .attr('viewBox', '0 -6 10 12')
      .attr('refX', 8)
      .attr('refY', 0)
      .attr('markerWidth', 6)
      .attr('markerHeight', 6)
      .attr('orient', 'auto')
      .append('path')
      .attr('d', 'M0,-6L10,0L0,6')
      .style('fill', theme.palette.text.secondary);

    // Create enhanced links
    const link = linkGroup.selectAll('.link')
      .data(links)
      .enter().append('g')
      .attr('class', 'link-group');

    // Background link
    link.append('line')
      .attr('class', 'link-bg')
      .style('stroke', theme.palette.divider)
      .style('stroke-width', 4)
      .style('stroke-opacity', 0.3)
      .style('stroke-linecap', 'round');

    // Main link
    link.append('line')
      .attr('class', 'link-main')
      .style('stroke', d => {
        const sourceNode = nodes.find(n => n.id === (typeof d.source === 'string' ? d.source : d.source.id));
        const targetNode = nodes.find(n => n.id === (typeof d.target === 'string' ? d.target : d.target.id));
        
        if (sourceNode?.priority === 'HIGH' || targetNode?.priority === 'HIGH') {
          return theme.palette.error.main;
        } else if (sourceNode?.priority === 'MEDIUM' || targetNode?.priority === 'MEDIUM') {
          return theme.palette.warning.main;
        }
        return theme.palette.primary.main;
      })
      .style('stroke-width', 2)
      .style('stroke-opacity', 0.8)
      .style('stroke-linecap', 'round')
      .attr('marker-end', 'url(#arrowhead-medium)');

    // Create project containers if enabled
    if (clusterByProject && showProjectContainers) {
      const projectRects = clusterGroup.selectAll('.cluster')
        .data(projects);

      projectRects.enter().append('rect')
        .attr('class', 'cluster')
        .attr('rx', 15)
        .attr('ry', 15)
        .style('fill', d => projectColorScale(d))
        .style('fill-opacity', 0.08)
        .style('stroke', d => projectColorScale(d))
        .style('stroke-width', 2)
        .style('stroke-opacity', 0.6)
        .style('stroke-dasharray', '8,4')
        .style('pointer-events', 'none');

      const projectHeaders = clusterGroup.selectAll('.project-header')
        .data(projects);

      const headerGroup = projectHeaders.enter().append('g')
        .attr('class', 'project-header');

      headerGroup.append('rect')
        .attr('class', 'project-header-bg')
        .attr('rx', 8)
        .attr('ry', 8)
        .style('fill', d => projectColorScale(d))
        .style('fill-opacity', 0.9)
        .style('stroke', d => projectColorScale(d))
        .style('stroke-width', 2)
        .style('pointer-events', 'none');

      headerGroup.append('text')
        .attr('class', 'project-title')
        .style('fill', 'white')
        .style('font-size', '12px')
        .style('font-weight', 'bold')
        .style('text-anchor', 'start')
        .style('dominant-baseline', 'central')
        .style('pointer-events', 'none')
        .text(d => d.toUpperCase());

      headerGroup.append('circle')
        .attr('class', 'task-count-bg')
        .attr('r', 10)
        .style('fill', 'rgba(255,255,255,0.9)')
        .style('stroke', d => projectColorScale(d))
        .style('stroke-width', 2)
        .style('pointer-events', 'none');

      headerGroup.append('text')
        .attr('class', 'task-count')
        .text(d => nodes.filter(n => n.project === d).length)
        .style('fill', d => projectColorScale(d))
        .style('font-size', '10px')
        .style('font-weight', 'bold')
        .style('text-anchor', 'middle')
        .style('dominant-baseline', 'central')
        .style('pointer-events', 'none');
    }

    // Create nodes
    const node = nodeGroup.selectAll('.node')
      .data(nodes)
      .enter().append('g')
      .attr('class', 'node')
      .style('cursor', 'pointer');

    // Add rectangles for nodes
    node.append('rect')
      .attr('width', (d, i) => nodeData[i].width)
      .attr('height', (d, i) => nodeData[i].height)
      .attr('x', (d, i) => -nodeData[i].width / 2)
      .attr('y', (d, i) => -nodeData[i].height / 2)
      .attr('rx', 6)
      .attr('ry', 6)
      .style('fill', d => {
        if (clusterByProject && d.project) {
          return projectColorScale(d.project);
        }
        switch (d.status) {
          case 'COMPLETED': return theme.palette.success.main;
          case 'ACTIVE': return theme.palette.warning.main;
          case 'PENDING': return theme.palette.grey[400];
          default: return theme.palette.info.main;
        }
      })
      .style('fill-opacity', d => {
        if (d.status === 'COMPLETED') return 0.6;
        if (d.status === 'ACTIVE') return 0.9;
        return clusterByProject && d.project ? 0.8 : 0.7;
      })
      .style('stroke', d => {
        const priorityConfig = getPriorityConfig(d.priority as any, theme);
        return priorityConfig.color;
      })
      .style('stroke-width', d => {
        switch (d.priority) {
          case 'HIGH': return 3;
          case 'MEDIUM': return 2;
          case 'LOW': return 1;
          default: return 1;
        }
      });

    // Add text labels
    node.each(function(d, i) {
      const nodeGroup = d3.select(this);
      const data = nodeData[i];
      const startY = -(data.lines.length - 1) * lineHeight / 2;

      data.lines.forEach((line, lineIndex) => {
        nodeGroup.append('text')
          .text(line)
          .attr('y', startY + lineIndex * lineHeight)
          .style('font-size', `${fontSize}px`)
          .style('font-weight', d.status === 'ACTIVE' ? 'bold' : 'normal')
          .style('fill', theme.palette.text.primary)
          .style('text-anchor', 'middle')
          .style('dominant-baseline', 'central')
          .style('pointer-events', 'none')
          .style('user-select', 'none');
      });
    });

    // Add zoom behavior to SVG
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.1, 4])
      .on('zoom', (event) => {
        mainGroup.attr('transform', event.transform);
      });

    svg.call(zoom);

    // Drag functions
    const dragstarted = (event: d3.D3DragEvent<SVGGElement, GraphNode, GraphNode>, d: GraphNode) => {
      if (!event.active) newSimulation.alphaTarget(0.3).restart();
      d.fx = d.x;
      d.fy = d.y;
    };

    const dragged = (event: d3.D3DragEvent<SVGGElement, GraphNode, GraphNode>, d: GraphNode) => {
      d.fx = event.x;
      d.fy = event.y;
    };

    const dragended = (event: d3.D3DragEvent<SVGGElement, GraphNode, GraphNode>, d: GraphNode) => {
      if (!event.active) newSimulation.alphaTarget(0);
      d.fx = null;
      d.fy = null;
    };

    // Add drag behavior to nodes
    node.call(d3.drag<SVGGElement, GraphNode>()
      .on('start', dragstarted)
      .on('drag', dragged)
      .on('end', dragended));

    // Add hover effects for better interactivity
    const nodeRects = node.select('rect');
    
    nodeRects
      .on('mouseenter', function(event, d) {
        d3.select(this)
          .style('fill-opacity', 1)
          .style('stroke-width', (d.priority === 'HIGH' ? 4 : d.priority === 'MEDIUM' ? 3 : 2))
          .style('filter', 'drop-shadow(2px 2px 4px rgba(0,0,0,0.3))');
        
        // Highlight connected relationships
        const connectedNodeIds = new Set<string>();
        links.forEach(link => {
          const source = typeof link.source === 'string' ? link.source : link.source.id;
          const target = typeof link.target === 'string' ? link.target : link.target.id;
          if (source === d.id) connectedNodeIds.add(target);
          if (target === d.id) connectedNodeIds.add(source);
        });
        
        // Dim non-connected nodes
        nodeRects.style('fill-opacity', (otherD) => {
          if (otherD.id === d.id || connectedNodeIds.has(otherD.id)) {
            return 1;
          }
          return 0.3;
        });
        
        // Highlight connected links
        link.selectAll('.link-main')
          .style('stroke-opacity', (linkD) => {
            const source = typeof linkD.source === 'string' ? linkD.source : linkD.source.id;
            const target = typeof linkD.target === 'string' ? linkD.target : linkD.target.id;
            return (source === d.id || target === d.id) ? 1 : 0.2;
          })
          .style('stroke-width', (linkD) => {
            const source = typeof linkD.source === 'string' ? linkD.source : linkD.source.id;
            const target = typeof linkD.target === 'string' ? linkD.target : linkD.target.id;
            if (source === d.id || target === d.id) {
              return 3; // Thicker for connected links
            }
            return 2;
          });
      })
      .on('mouseleave', function(event, d) {
        d3.select(this)
          .style('fill-opacity', d => {
            if (d.status === 'COMPLETED') return 0.6;
            if (d.status === 'ACTIVE') return 0.9;
            return clusterByProject && d.project ? 0.8 : 0.7;
          })
          .style('stroke-width', d => {
            switch (d.priority) {
              case 'HIGH': return 3;
              case 'MEDIUM': return 2;
              case 'LOW': return 1;
              default: return 1;
            }
          })
          .style('filter', 'none');
        
        // Reset all nodes and links
        nodeRects.style('fill-opacity', d => {
          if (d.status === 'COMPLETED') return 0.6;
          if (d.status === 'ACTIVE') return 0.9;
          return clusterByProject && d.project ? 0.8 : 0.7;
        });
        
        link.selectAll('.link-main')
          .style('stroke-opacity', 0.8)
          .style('stroke-width', 2);
      });

    // Custom charge force that reduces repulsion between tasks in the same project
    const projectAwareCharge = () => {
      let nodes: GraphNode[];
      const strength = chargeStrength; // Use the global charge strength

      function force(alpha: number) {
        for (let i = 0; i < nodes.length; i++) {
          const nodeA = nodes[i];
          for (let j = i + 1; j < nodes.length; j++) {
            const nodeB = nodes[j];
            
            const dx = nodeB.x! - nodeA.x!;
            const dy = nodeB.y! - nodeA.y!;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance === 0) continue;
            
            let forceStrength = strength;
            
            // Reduce repulsion between tasks in the same project
            if (clusterByProject && nodeA.project && nodeB.project && nodeA.project === nodeB.project) {
              forceStrength = strength * 0.3; // Increased from 0.2 to 0.3 for slightly more repulsion within projects
            }
            
            // Apply the force
            const force = forceStrength * alpha / (distance * distance);
            const fx = dx * force;
            const fy = dy * force;
            
            nodeA.vx! -= fx;
            nodeA.vy! -= fy;
            nodeB.vx! += fx;
            nodeB.vy! += fy;
          }
        }
      }

      force.initialize = function(_nodes: GraphNode[]) {
        nodes = _nodes;
      };

      return force;
    };

    const newSimulation = d3.forceSimulation<GraphNode>(nodes)
      .force('link', d3.forceLink<GraphNode, GraphLink>(links).id(d => d.id).distance(linkDistance))
      .force('charge', projectAwareCharge()) // Use custom charge with reduced same-project repulsion
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide().radius(40)) // Increased from 25 to 40 for more spacing
      .force('clustering', forceProjectClustering()) // Simple project clustering
      .force('x', d3.forceX(width / 2).strength(boundaryStrength))
      .force('y', d3.forceY(height / 2).strength(boundaryStrength));

    // Update positions on tick
    newSimulation.on('tick', () => {
      // Update links
      link.selectAll('.link-bg, .link-main')
        .attr('x1', d => (d.source as GraphNode).x!)
        .attr('y1', d => (d.source as GraphNode).y!)
        .attr('x2', d => (d.target as GraphNode).x!)
        .attr('y2', d => (d.target as GraphNode).y!);

      node.attr('transform', d => `translate(${d.x},${d.y})`);

      // Update project containers using calculated boundaries
      if (clusterByProject && showProjectContainers) {
        clusterGroup.selectAll('.cluster')
          .attr('x', (d: string) => {
            const boundary = calculateProjectBoundary(d);
            return boundary ? boundary.x : 0;
          })
          .attr('y', (d: string) => {
            const boundary = calculateProjectBoundary(d);
            return boundary ? boundary.y : 0;
          })
          .attr('width', (d: string) => {
            const boundary = calculateProjectBoundary(d);
            return boundary ? boundary.width : 200;
          })
          .attr('height', (d: string) => {
            const boundary = calculateProjectBoundary(d);
            return boundary ? boundary.height : 100;
          });

        clusterGroup.selectAll('.project-header')
          .attr('transform', (d: string) => {
            const boundary = calculateProjectBoundary(d);
            const x = boundary ? boundary.x + 10 : 10;
            const y = boundary ? boundary.y + 5 : 5;
            return `translate(${x}, ${y})`;
          });

        clusterGroup.selectAll('.project-header-bg')
          .attr('width', (d: string) => {
            const boundary = calculateProjectBoundary(d);
            return boundary ? boundary.width - 20 : 180;
          })
          .attr('height', 25);

        clusterGroup.selectAll('.project-title')
          .attr('x', 8)
          .attr('y', 12);

        clusterGroup.selectAll('.task-count-bg')
          .attr('cx', (d: string) => {
            const boundary = calculateProjectBoundary(d);
            return boundary ? boundary.width - 25 : 155;
          })
          .attr('cy', 12);

        clusterGroup.selectAll('.task-count')
          .attr('x', (d: string) => {
            const boundary = calculateProjectBoundary(d);
            return boundary ? boundary.width - 25 : 155;
          })
          .attr('y', 12);
      }
    });

    setSimulation(newSimulation);

    return () => {
      newSimulation.stop();
    };
  }, [graphData, width, height, clusterByProject, showProjectContainers, theme, projects, projectColorScale, linkDistance, chargeStrength, boundaryStrength]);

  // Update simulation forces when parameters change
  useEffect(() => {
    if (simulation) {
      // Recreate the project-aware charge force with updated parameters
      const projectAwareCharge = () => {
        let nodes: GraphNode[];
        const strength = chargeStrength;

        function force(alpha: number) {
          for (let i = 0; i < nodes.length; i++) {
            const nodeA = nodes[i];
            for (let j = i + 1; j < nodes.length; j++) {
              const nodeB = nodes[j];
              
              const dx = nodeB.x! - nodeA.x!;
              const dy = nodeB.y! - nodeA.y!;
              const distance = Math.sqrt(dx * dx + dy * dy);
              
              if (distance === 0) continue;
              
              let forceStrength = strength;
              
              // Reduce repulsion between tasks in the same project
              if (clusterByProject && nodeA.project && nodeB.project && nodeA.project === nodeB.project) {
                forceStrength = strength * 0.2; // Only 20% of normal repulsion within same project
              }
              
              // Apply the force
              const force = forceStrength * alpha / (distance * distance);
              const fx = dx * force;
              const fy = dy * force;
              
              nodeA.vx! -= fx;
              nodeA.vy! -= fy;
              nodeB.vx! += fx;
              nodeB.vy! += fy;
            }
          }
        }

        force.initialize = function(_nodes: GraphNode[]) {
          nodes = _nodes;
        };

        return force;
      };

      simulation
        .force('link', d3.forceLink<GraphNode, GraphLink>().id(d => d.id).distance(linkDistance))
        .force('charge', projectAwareCharge()) // Use updated custom charge
        .force('clustering', forceProjectClustering()) // Simple project clustering
        .force('x', d3.forceX(width / 2).strength(boundaryStrength))
        .force('y', d3.forceY(height / 2).strength(boundaryStrength))
        .alpha(0.3)
        .restart();
    }
  }, [simulation, linkDistance, chargeStrength, boundaryStrength, width, height, clusterByProject]);

  return (
    <Paper sx={{ p: 2, height: '100%', display: 'flex', flexDirection: 'column', position: 'relative' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">Task Dependency Graph</Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          {/* Zoom Controls */}
          <ButtonGroup size="small" variant="outlined">
            <IconButton
              onClick={() => {
                if (svgRef.current) {
                  const svg = d3.select(svgRef.current);
                  const zoom = d3.zoom<SVGSVGElement, unknown>();
                  svg.transition().duration(300).call(
                    zoom.scaleBy, 1.5
                  );
                }
              }}
              size="small"
              title="Zoom In"
            >
              <ZoomIn fontSize="small" />
            </IconButton>
            <IconButton
              onClick={() => {
                if (svgRef.current) {
                  const svg = d3.select(svgRef.current);
                  const zoom = d3.zoom<SVGSVGElement, unknown>();
                  svg.transition().duration(300).call(
                    zoom.scaleBy, 0.67
                  );
                }
              }}
              size="small"
              title="Zoom Out"
            >
              <ZoomOut fontSize="small" />
            </IconButton>
            <IconButton
              onClick={() => {
                if (svgRef.current) {
                  const svg = d3.select(svgRef.current);
                  const zoom = d3.zoom<SVGSVGElement, unknown>();
                  svg.transition().duration(500).call(
                    zoom.transform,
                    d3.zoomIdentity
                  );
                }
              }}
              size="small"
              title="Reset View"
            >
              <CenterFocusStrong fontSize="small" />
            </IconButton>
          </ButtonGroup>
          
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
          
          {clusterByProject && (
            <FormControlLabel
              control={
                <Switch
                  checked={showProjectContainers}
                  onChange={(e) => setShowProjectContainers(e.target.checked)}
                  color="secondary"
                />
              }
              label="Show Project Containers"
            />
          )}
          
          <IconButton
            onClick={() => setShowSettings(!showSettings)}
            size="small"
            title="Graph Settings"
          >
            <Settings fontSize="small" />
          </IconButton>
        </Box>
      </Box>

      <Collapse in={showSettings}>
        <Paper sx={{ p: 2, mb: 2, bgcolor: 'background.default' }}>
          <Typography variant="subtitle2" gutterBottom>
            Force Parameters
          </Typography>
          <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
            <Box sx={{ minWidth: 200 }}>
              <Typography variant="caption" gutterBottom>
                Link Distance: {linkDistance}px
              </Typography>
              <Slider
                value={linkDistance}
                onChange={(_, value) => setLinkDistance(value as number)}
                min={100}
                max={400}
                step={10}
                size="small"
              />
            </Box>
            <Box sx={{ minWidth: 200 }}>
              <Typography variant="caption" gutterBottom>
                Node Repulsion: {Math.abs(chargeStrength)}
              </Typography>
              <Slider
                value={Math.abs(chargeStrength)}
                onChange={(_, value) => setChargeStrength(-(value as number))}
                min={200}
                max={1200}
                step={50}
                size="small"
              />
            </Box>
            <Box sx={{ minWidth: 200 }}>
              <Typography variant="caption" gutterBottom>
                Boundary Constraint: {boundaryStrength}
              </Typography>
              <Slider
                value={boundaryStrength}
                onChange={(_, value) => setBoundaryStrength(value as number)}
                min={0}
                max={0.5}
                step={0.01}
                size="small"
              />
            </Box>
          </Box>
        </Paper>
      </Collapse>

      <Box sx={{ 
        flex: 1, 
        overflow: 'auto',
        width: '100%',
        border: `1px solid ${theme.palette.divider}`,
        borderRadius: 1,
        bgcolor: 'background.paper'
      }}>
        {tasks.length === 0 ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
            <Typography variant="body2" color="text.secondary">
              No tasks to display
            </Typography>
          </Box>
        ) : (
          <svg 
            ref={svgRef} 
            style={{ 
              width: `${width}px`, 
              height: `${height}px`, 
              display: 'block',
              minWidth: '100%',
              minHeight: '100%'
            }} 
          />
        )}
      </Box>
      
      <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
        📦 Box size adapts to task title length • 🎨 Border thickness indicates priority • 🖱️ Drag nodes to reposition • 🔍 Mouse wheel to zoom • ✨ Hover to highlight connections • 🎯 Use zoom controls to navigate
        {clusterByProject && projects.length > 0 && (
          <span> • 📐 Canvas: {width}×{height}px ({projects.length} projects)</span>
        )}
      </Typography>
    </Paper>
  );
};

export default ForceDirectedTaskGraph;
