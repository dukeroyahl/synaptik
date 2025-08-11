import React, { useEffect, useRef } from 'react';
import { Box, Typography, Paper } from '@mui/material';
import * as d3 from 'd3';
import { TaskDTO } from '../types';

interface UnifiedTaskGraphProps {
  tasks: TaskDTO[];
}

interface GraphNode {
  id: string;
  title: string;
  status: string;
  priority: string;
  dependencyCount: number;
  dependentCount: number;
}

interface GraphLink {
  source: string;
  target: string;
}

const UnifiedTaskGraph: React.FC<UnifiedTaskGraphProps> = ({ tasks }) => {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current || tasks.length === 0) return;

    // Clear previous graph
    d3.select(svgRef.current).selectAll('*').remove();

    // Helper function to get tasks that depend on a given task
    const getTasksDependingOn = (taskId: string) => {
      return tasks.filter(task => task.depends && task.depends.includes(taskId));
    };

    // Prepare nodes - only show tasks that have dependencies or dependents
    const tasksWithRelationships = tasks.filter(task => {
      const hasDependencies = task.depends && task.depends.length > 0;
      const hasDependents = getTasksDependingOn(task.id).length > 0;
      return hasDependencies || hasDependents;
    });

    if (tasksWithRelationships.length === 0) {
      // Show a message if no relationships exist
      const svg = d3.select(svgRef.current);
      svg.append('text')
        .attr('x', '50%')
        .attr('y', '50%')
        .attr('text-anchor', 'middle')
        .attr('dominant-baseline', 'middle')
        .attr('fill', '#666')
        .attr('font-size', '16px')
        .text('No task dependencies to visualize');
      return;
    }

    const nodes: GraphNode[] = tasksWithRelationships.map(task => ({
      id: task.id,
      title: task.title,
      status: task.status,
      priority: task.priority,
      dependencyCount: task.depends ? task.depends.length : 0,
      dependentCount: getTasksDependingOn(task.id).length
    }));

    // Create links for all dependencies
    const links: GraphLink[] = [];
    tasksWithRelationships.forEach(task => {
      if (task.depends && task.depends.length > 0) {
        task.depends.forEach(depId => {
          // Only add link if both tasks are in our filtered set
          if (tasksWithRelationships.find(t => t.id === depId)) {
            links.push({
              source: depId,
              target: task.id
            });
          }
        });
      }
    });

    // Set up SVG dimensions
    const width = svgRef.current.clientWidth;
    const height = 400;

    // Create SVG
    const svg = d3.select(svgRef.current)
      .attr('width', width)
      .attr('height', height);

    // Create simulation
    const simulation = d3.forceSimulation<any>(nodes)
      .force('link', d3.forceLink(links).id((d: any) => d.id).distance(120))
      .force('charge', d3.forceManyBody().strength(-400))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide().radius(40));

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
      .attr('refX', 25)
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
      .style('cursor', 'pointer')
      .call(d3.drag<any, any>()
        .on('start', dragstarted)
        .on('drag', dragged)
        .on('end', dragended));

    // Add circles to nodes
    node.append('circle')
      .attr('r', (d) => {
        // Size based on number of relationships
        const relationshipCount = d.dependencyCount + d.dependentCount;
        return Math.max(25, Math.min(40, 25 + relationshipCount * 3));
      })
      .attr('fill', (d) => {
        // Color based on status first, then priority
        if (d.status === 'completed') return '#4caf50'; // Green for completed
        if (d.status === 'active') return '#2196f3'; // Blue for active
        
        // For pending tasks, color by priority
        switch (d.priority) {
          case 'H': return '#f44336'; // High priority - red
          case 'M': return '#ff9800'; // Medium priority - orange
          case 'L': return '#03a9f4'; // Low priority - light blue
          default: return '#9e9e9e'; // No priority - gray
        }
      })
      .attr('stroke', '#fff')
      .attr('stroke-width', 2)
      .attr('opacity', (d) => d.status === 'completed' ? 0.7 : 0.9);

    // Add task titles
    node.append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', (d) => {
        const relationshipCount = d.dependencyCount + d.dependentCount;
        const radius = Math.max(25, Math.min(40, 25 + relationshipCount * 3));
        return radius + 15;
      })
      .attr('font-size', '10px')
      .attr('font-weight', '600')
      .text((d) => {
        // Truncate long titles
        return d.title.length > 20 ? d.title.substring(0, 17) + '...' : d.title;
      })
      .attr('fill', '#1a1a1a')
      .style('pointer-events', 'none')
      .style('text-shadow', '0 0 3px rgba(255, 255, 255, 0.8)');

    // Add dependency count badges
    node.filter(d => d.dependencyCount > 0)
      .append('circle')
      .attr('cx', -15)
      .attr('cy', -15)
      .attr('r', 8)
      .attr('fill', '#ff5722')
      .attr('stroke', '#fff')
      .attr('stroke-width', 1);

    node.filter(d => d.dependencyCount > 0)
      .append('text')
      .attr('x', -15)
      .attr('y', -11)
      .attr('text-anchor', 'middle')
      .attr('font-size', '8px')
      .attr('font-weight', 'bold')
      .attr('fill', '#fff')
      .text(d => d.dependencyCount)
      .style('pointer-events', 'none');

    // Add dependent count badges
    node.filter(d => d.dependentCount > 0)
      .append('circle')
      .attr('cx', 15)
      .attr('cy', -15)
      .attr('r', 8)
      .attr('fill', '#4caf50')
      .attr('stroke', '#fff')
      .attr('stroke-width', 1);

    node.filter(d => d.dependentCount > 0)
      .append('text')
      .attr('x', 15)
      .attr('y', -11)
      .attr('text-anchor', 'middle')
      .attr('font-size', '8px')
      .attr('font-weight', 'bold')
      .attr('fill', '#fff')
      .text(d => d.dependentCount)
      .style('pointer-events', 'none');

    // Add tooltips on hover
    node.append('title')
      .text((d) => `${d.title}\nStatus: ${d.status}\nPriority: ${d.priority || 'None'}\nDependencies: ${d.dependencyCount}\nDependent tasks: ${d.dependentCount}`);

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
  }, [tasks]);

  return (
    <Paper 
      variant="outlined" 
      sx={{ 
        p: 2,
        backgroundColor: (theme) => 
          theme.palette.mode === 'dark' 
            ? 'rgba(255, 255, 255, 0.05)' 
            : '#ffffff',
        backdropFilter: 'blur(10px)',
        border: (theme) => 
          theme.palette.mode === 'dark'
            ? '1px solid rgba(255, 255, 255, 0.1)'
            : '1px solid rgba(0, 0, 0, 0.1)',
        boxShadow: (theme) =>
          theme.palette.mode === 'dark'
            ? '0 2px 8px rgba(0, 0, 0, 0.15)'
            : '0 1px 4px rgba(0, 0, 0, 0.08)'
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Box sx={{ display: 'flex', gap: 2, fontSize: '0.75rem', color: 'text.secondary' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#ff5722' }} />
            <span>Dependencies</span>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#4caf50' }} />
            <span>Dependents</span>
          </Box>
        </Box>
      </Box>
      <Box sx={{ 
        width: '100%', 
        height: 400, 
        overflow: 'hidden',
        backgroundColor: (theme) => 
          theme.palette.mode === 'dark' 
            ? 'rgba(255, 255, 255, 0.02)' 
            : '#fafafa',
        borderRadius: 1,
        border: (theme) => 
          theme.palette.mode === 'dark'
            ? '1px solid rgba(255, 255, 255, 0.05)'
            : '1px solid rgba(0, 0, 0, 0.05)',
      }}>
        <svg ref={svgRef} style={{ width: '100%', height: '100%' }}></svg>
      </Box>
    </Paper>
  );
};

export default UnifiedTaskGraph;
