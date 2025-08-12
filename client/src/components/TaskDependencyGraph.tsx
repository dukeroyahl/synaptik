import React, { useEffect, useRef } from 'react';
import { Box, Typography, Paper, useTheme } from '@mui/material';
import * as d3 from 'd3';
import { Task } from '../types';
import { getPriorityConfig } from '../utils/priorityUtils';

interface TaskDependencyGraphProps {
  task: Task;
  dependencyTasks: Task[];
}

interface GraphNode {
  id: string;
  title: string;
  status: string;
  priority: string;
}

interface GraphLink {
  source: string;
  target: string;
}

const TaskDependencyGraph: React.FC<TaskDependencyGraphProps> = ({ task, dependencyTasks }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const theme = useTheme();

  useEffect(() => {
    if (!svgRef.current || !task || dependencyTasks.length === 0) return;

    // Clear previous graph
    d3.select(svgRef.current).selectAll('*').remove();

    // Prepare data for graph
    const nodes: GraphNode[] = [
      {
        id: task.id,
        title: task.title,
        status: task.status,
        priority: task.priority
      },
      ...dependencyTasks.map(depTask => ({
        id: depTask.id,
        title: depTask.title,
        status: depTask.status,
        priority: depTask.priority
      }))
    ];

    const links: GraphLink[] = dependencyTasks.map(depTask => ({
      source: depTask.id,
      target: task.id
    }));

    // Set up SVG dimensions
    const width = svgRef.current.clientWidth;
    const height = 350;

    // Create SVG
    const svg = d3.select(svgRef.current)
      .attr('width', width)
      .attr('height', height);

    // Create simulation with better spacing for larger nodes
    const simulation = d3.forceSimulation<any>(nodes)
      .force('link', d3.forceLink(links).id((d: any) => d.id).distance(150))
      .force('charge', d3.forceManyBody().strength(-500))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide().radius(50));

    // Create links
    const link = svg.append('g')
      .selectAll('line')
      .data(links)
      .enter()
      .append('line')
      .attr('stroke', '#999')
      .attr('stroke-opacity', 0.6)
      .attr('stroke-width', 2)
      .attr('marker-end', 'url(#arrowhead)');

    // Define arrow marker
    svg.append('defs').append('marker')
      .attr('id', 'arrowhead')
      .attr('viewBox', '-0 -5 10 10')
      .attr('refX', 30)
      .attr('refY', 0)
      .attr('orient', 'auto')
      .attr('markerWidth', 8)
      .attr('markerHeight', 8)
      .append('path')
      .attr('d', 'M 0,-5 L 10,0 L 0,5')
      .attr('fill', '#999');

    // Create node groups
    const node = svg.append('g')
      .selectAll('.node')
      .data(nodes)
      .enter()
      .append('g')
      .attr('class', 'node')
      .call(d3.drag<any, any>()
        .on('start', dragstarted)
        .on('drag', dragged)
        .on('end', dragended));

    // Add circles to nodes (increased size for better text visibility)
    node.append('circle')
      .attr('r', 35)
      .attr('fill', (d) => {
        if (d.id === task.id) return '#4caf50'; // Current task is green
        
        // Color based on priority using unified system
        const priorityConfig = getPriorityConfig(d.priority as any, theme);
        return priorityConfig.color;
      })
      .attr('stroke', '#fff')
      .attr('stroke-width', 2)
      .attr('opacity', 0.9);

    // Add task titles with better handling for longer text
    node.append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', 45)
      .attr('font-size', '11px')
      .attr('font-weight', '500')
      .each(function(d) {
        const text = d3.select(this);
        const words = d.title.split(/\s+/);
        
        if (words.length === 1 && d.title.length <= 20) {
          // Single word or short title - display as is
          text.text(d.title);
        } else if (d.title.length <= 30) {
          // Medium length - display full title
          text.text(d.title);
        } else {
          // Long title - split into multiple lines
          text.text(''); // Clear the text
          let line: string[] = [];
          let lineNumber = 0;
          const lineHeight = 1.1; // ems
          const maxWidth = 120; // pixels
          
          for (let i = 0; i < words.length; i++) {
            line.push(words[i]);
            const testLine = line.join(' ');
            
            // Estimate text width (rough approximation)
            if (testLine.length * 6.5 > maxWidth && line.length > 1) {
              line.pop();
              text.append('tspan')
                .attr('x', 0)
                .attr('dy', lineNumber === 0 ? 0 : `${lineHeight}em`)
                .text(line.join(' '));
              line = [words[i]];
              lineNumber++;
              
              // Limit to 2 lines
              if (lineNumber >= 2) {
                break;
              }
            }
          }
          
          // Add remaining words
          if (line.length > 0 && lineNumber < 2) {
            let finalLine = line.join(' ');
            if (lineNumber === 1 && finalLine.length > 15) {
              finalLine = finalLine.substring(0, 15) + '...';
            }
            text.append('tspan')
              .attr('x', 0)
              .attr('dy', lineNumber === 0 ? 0 : `${lineHeight}em`)
              .text(finalLine);
          }
        }
      })
      .attr('fill', '#1a1a1a')
      .attr('font-weight', '600')
      .style('pointer-events', 'none')
      .style('text-shadow', '0 0 3px rgba(255, 255, 255, 0.8), 0 0 6px rgba(255, 255, 255, 0.6)');

    // Add subtle background rectangles behind text for better readability
    node.insert('rect', 'text')
      .attr('x', -60)
      .attr('y', 35)
      .attr('width', 120)
      .attr('height', (d) => {
        // Estimate height based on text length
        return d.title.length > 30 ? 26 : 14;
      })
      .attr('fill', 'rgba(255, 255, 255, 0.9)')
      .attr('stroke', 'rgba(0, 0, 0, 0.1)')
      .attr('stroke-width', 0.5)
      .attr('rx', 3)
      .attr('ry', 3);

    // Update positions on simulation tick
    simulation.on('tick', () => {
      link
        .attr('x1', (d: any) => d.source.x)
        .attr('y1', (d: any) => d.source.y)
        .attr('x2', (d: any) => d.target.x)
        .attr('y2', (d: any) => d.target.y);

      node.attr('transform', (d: any) => `translate(${d.x},${d.y})`);
    });

    // Drag functions
    function dragstarted(event: any) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      event.subject.fx = event.subject.x;
      event.subject.fy = event.subject.y;
    }

    function dragged(event: any) {
      event.subject.fx = event.x;
      event.subject.fy = event.y;
    }

    function dragended(event: any) {
      if (!event.active) simulation.alphaTarget(0);
      event.subject.fx = null;
      event.subject.fy = null;
    }

    return () => {
      simulation.stop();
    };
  }, [task, dependencyTasks]);

  if (!task || dependencyTasks.length === 0) {
    return (
      <Box sx={{ p: 2, textAlign: 'center' }}>
        <Typography color="text.secondary">
          No dependencies to visualize
        </Typography>
      </Box>
    );
  }

  return (
    <Paper 
      variant="outlined" 
      sx={{ 
        p: 2, 
        mt: 2,
        backgroundColor: (theme) => 
          theme.palette.mode === 'dark' 
            ? 'rgba(255, 255, 255, 0.15)' 
            : '#ffffff',
        backdropFilter: 'blur(10px)',
        border: (theme) => 
          theme.palette.mode === 'dark'
            ? '1px solid rgba(255, 255, 255, 0.2)'
            : '1px solid rgba(0, 0, 0, 0.1)',
        boxShadow: (theme) =>
          theme.palette.mode === 'dark'
            ? '0 2px 8px rgba(0, 0, 0, 0.15)'
            : '0 1px 4px rgba(0, 0, 0, 0.08)'
      }}
    >
      <Typography variant="subtitle2" gutterBottom>
        Dependency Visualization
      </Typography>
      <Box sx={{ 
        width: '100%', 
        height: 350, 
        overflow: 'hidden',
        backgroundColor: (theme) => 
          theme.palette.mode === 'dark' 
            ? 'rgba(255, 255, 255, 0.12)' 
            : '#fafafa',
        borderRadius: 1,
        border: (theme) => 
          theme.palette.mode === 'dark'
            ? '1px solid rgba(255, 255, 255, 0.1)'
            : '1px solid rgba(0, 0, 0, 0.05)',
        boxShadow: 'none'
      }}>
        <svg ref={svgRef} style={{ width: '100%', height: '100%' }}></svg>
      </Box>
    </Paper>
  );
};

export default TaskDependencyGraph;
