'use client';

import React, { useCallback, useRef } from 'react';
import ReactFlow, {
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  BackgroundVariant,
  Connection,
  Edge,
  Node,
  ReactFlowInstance,
  Panel,
  MarkerType,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { useNetwork } from '@/context/network-context';
import CustomNode from './custom-node';
import { Button } from './ui/button';
import { Play, Plus, Trash2 } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { exampleScenarios } from '@/lib/example-scenarios';

const nodeTypes = { custom: CustomNode };

export function NetworkCanvas() {
  const {
    nodes,
    setNodes,
    onNodesChange,
    edges,
    setEdges,
    onEdgesChange,
    setSelectedElement,
    runSimulation,
    clearNetwork,
    loadExample,
  } = useNetwork();
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const [reactFlowInstance, setReactFlowInstance] =
    React.useState<ReactFlowInstance | null>(null);

  const onConnect = useCallback(
    (params: Connection | Edge) =>
      setEdges((eds) =>
        addEdge({ ...params, type: 'default', markerEnd: { type: MarkerType.ArrowClosed }, data: { latency: 10, bandwidth: 100 } }, eds)
      ),
    [setEdges]
  );

   const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      if (!reactFlowInstance || !reactFlowWrapper.current) {
        return;
      }

      const reactFlowBounds = reactFlowWrapper.current.getBoundingClientRect();
      const type = event.dataTransfer.getData('application/reactflow');

      // check if the dropped element is valid
      if (typeof type === 'undefined' || !type) {
        return;
      }

      const position = reactFlowInstance.screenToFlowPosition({
        x: event.clientX - reactFlowBounds.left,
        y: event.clientY - reactFlowBounds.top,
      });
      const newNodeId = `node_${+new Date()}`;
      const newNode: Node = {
        id: newNodeId,
        type: 'custom', // Using custom node
        position,
        data: {
          id: newNodeId,
          label: `Node ${nodes.length + 1}`,
          battery: 100,
          queueSize: 0,
          role: 'sensor', // Default role
          isSelected: false,
        },
      };

      setNodes((nds) => nds.concat(newNode));
    },
    [reactFlowInstance, nodes.length, setNodes]
  );

  const onNodeClick = useCallback(
    (_: React.MouseEvent, node: Node) => {
      setSelectedElement(node);
      setNodes((nds) =>
        nds.map((n) => ({
          ...n,
          data: { ...n.data, isSelected: n.id === node.id },
        }))
      );
       setEdges((eds) =>
        eds.map((e) => ({
          ...e,
          data: { ...e.data, isSelected: false },
        }))
      );
    },
    [setSelectedElement, setNodes, setEdges]
  );

  const onEdgeClick = useCallback(
    (_: React.MouseEvent, edge: Edge) => {
      setSelectedElement(edge);
      setEdges((eds) =>
        eds.map((e) => ({
          ...e,
          data: { ...e.data, isSelected: e.id === edge.id },
           style: { stroke: e.id === edge.id ? 'hsl(var(--accent))' : 'hsl(var(--primary))', strokeWidth: e.id === edge.id ? 3 : 2 }
        }))
      );
       setNodes((nds) =>
        nds.map((n) => ({
          ...n,
          data: { ...n.data, isSelected: false },
        }))
      );
    },
    [setSelectedElement, setEdges, setNodes]
  );

   const onPaneClick = useCallback(() => {
    setSelectedElement(null);
     setNodes((nds) =>
        nds.map((n) => ({
          ...n,
          data: { ...n.data, isSelected: false },
        }))
      );
     setEdges((eds) =>
        eds.map((e) => ({
          ...e,
          data: { ...e.data, isSelected: false },
          style: { stroke: 'hsl(var(--primary))', strokeWidth: 2 }
        }))
      );
  }, [setSelectedElement, setNodes, setEdges]);

  const handleAddNode = useCallback(() => {
    const newNodeId = `node_${+new Date()}`;
    const newNode: Node = {
      id: newNodeId,
      type: 'custom',
      position: { x: Math.random() * 400, y: Math.random() * 400 },
      data: {
        id: newNodeId,
        label: `Node ${nodes.length + 1}`,
        battery: 100,
        queueSize: 0,
        role: 'sensor',
        isSelected: false,
      },
    };
    setNodes((nds) => nds.concat(newNode));
  }, [nodes.length, setNodes]);

  const handleExampleChange = (value: string) => {
    if (value === 'clear') {
      clearNetwork();
    } else {
       const example = exampleScenarios.find(ex => ex.id === value);
       if (example) {
         loadExample(example.data);
       }
    }
  };

  return (
    <div className="flex-grow h-2/3 relative" ref={reactFlowWrapper}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onInit={setReactFlowInstance}
        onDrop={onDrop}
        onDragOver={onDragOver}
        onNodeClick={onNodeClick}
        onEdgeClick={onEdgeClick}
        onPaneClick={onPaneClick}
        nodeTypes={nodeTypes}
        fitView
        className="bg-background"
      >
        <Controls />
        <MiniMap nodeStrokeWidth={3} zoomable pannable />
        <Background variant={BackgroundVariant.Dots} gap={12} size={1} />
        <Panel position="top-left" className="flex gap-2 p-2">
           <Select onValueChange={handleExampleChange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Load Example" />
            </SelectTrigger>
            <SelectContent>
              {exampleScenarios.map((ex) => (
                 <SelectItem key={ex.id} value={ex.id}>{ex.name}</SelectItem>
              ))}
               <SelectItem value="clear">Clear Network</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={handleAddNode}>
            <Plus className="mr-2 h-4 w-4" /> Add Node
          </Button>
          <Button variant="destructive" size="sm" onClick={clearNetwork}>
            <Trash2 className="mr-2 h-4 w-4" /> Clear All
          </Button>
          <Button variant="default" size="sm" onClick={runSimulation}>
             <Play className="mr-2 h-4 w-4" /> Run Simulation
          </Button>
        </Panel>
      </ReactFlow>
    </div>
  );
}
