'use client';

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import {
  useNodesState,
  useEdgesState,
  Node,
  Edge,
  OnNodesChange,
  OnEdgesChange,
  applyNodeChanges,
  applyEdgeChanges,
  MarkerType,
} from 'reactflow';
import { useToast } from '@/hooks/use-toast';
import { exampleScenarios } from '@/lib/example-scenarios';

// Define types for network elements and simulation
export interface NodeData {
  id: string;
  label: string;
  battery: number;
  queueSize: number;
  role: 'sensor' | 'router' | 'gateway';
  isSelected?: boolean;
}

export interface EdgeData {
  latency: number;
  bandwidth: number;
  isSelected?: boolean;
}

export interface SimulationParams {
  algorithm: 'dijkstra' | 'bellman-ford' | 'adaptive' | 'compare';
  sourceNode: string | null;
  targetNode: string | null;
  weights: {
    alpha: number; // latency
    beta: number;  // battery
    gamma: number; // queueSize
  };
}

export interface PerformanceMetricsData {
  energyConsumption: number;
  averageLatency: number;
  deliveryRatio: number;
  networkLifetime: number; // e.g., in simulation steps or time units
}

export interface SimulationResult {
  algorithm: string;
  path: string[]; // Node IDs forming the path
  metrics: PerformanceMetricsData;
}

// Define context type
interface NetworkContextType {
  nodes: Node<NodeData>[];
  setNodes: React.Dispatch<React.SetStateAction<Node<NodeData>[]>>;
  onNodesChange: OnNodesChange;
  edges: Edge<EdgeData>[];
  setEdges: React.Dispatch<React.SetStateAction<Edge<EdgeData>[]>>;
  onEdgesChange: OnEdgesChange;
  selectedElement: Node<NodeData> | Edge<EdgeData> | null;
  setSelectedElement: (element: Node<NodeData> | Edge<EdgeData> | null) => void;
  updateNodeData: (nodeId: string, data: Partial<NodeData>) => void;
  updateEdgeData: (edgeId: string, data: Partial<EdgeData>) => void;
  simulationParams: SimulationParams;
  setSimulationParams: React.Dispatch<React.SetStateAction<SimulationParams>>;
  simulationResults: SimulationResult[] | null;
  runSimulation: () => void;
  clearNetwork: () => void;
  loadExample: (data: { nodes: Node<NodeData>[], edges: Edge<EdgeData>[] }) => void;
  deleteSelectedElement: () => void;
}

const NetworkContext = createContext<NetworkContextType | undefined>(undefined);

// Initial state
const initialNodes: Node<NodeData>[] = exampleScenarios[0].data.nodes;
const initialEdges: Edge<EdgeData>[] = exampleScenarios[0].data.edges;

export const NetworkProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [nodes, setNodes, onNodesChange] = useNodesState<NodeData>(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState<EdgeData>(initialEdges);
  const [selectedElement, setSelectedElement] = useState<Node<NodeData> | Edge<EdgeData> | null>(null);
  const [simulationParams, setSimulationParams] = useState<SimulationParams>({
    algorithm: 'adaptive',
    sourceNode: initialNodes.length > 0 ? initialNodes[0].id : null,
    targetNode: initialNodes.length > 1 ? initialNodes[initialNodes.length - 1].id : null,
    weights: { alpha: 0.4, beta: 0.3, gamma: 0.3 },
  });
  const [simulationResults, setSimulationResults] = useState<SimulationResult[] | null>(null);
  const { toast } = useToast();

   // Update source/target if nodes change
  useEffect(() => {
     const nodeIds = nodes.map(n => n.id);
     if (simulationParams.sourceNode && !nodeIds.includes(simulationParams.sourceNode)) {
       setSimulationParams(prev => ({ ...prev, sourceNode: nodeIds[0] || null }));
     }
     if (simulationParams.targetNode && !nodeIds.includes(simulationParams.targetNode)) {
       setSimulationParams(prev => ({ ...prev, targetNode: nodeIds[nodeIds.length - 1] || null }));
     }
      // Ensure source and target are different if possible
      if (nodes.length > 1 && simulationParams.sourceNode === simulationParams.targetNode) {
         const newTarget = nodeIds.find(id => id !== simulationParams.sourceNode);
         if (newTarget) {
             setSimulationParams(prev => ({ ...prev, targetNode: newTarget }));
         }
      }

  }, [nodes, simulationParams.sourceNode, simulationParams.targetNode]);


  const updateNodeData = useCallback((nodeId: string, data: Partial<NodeData>) => {
    setNodes((nds) =>
      nds.map((node) =>
        node.id === nodeId ? { ...node, data: { ...node.data, ...data } } : node
      )
    );
    // Update selected element data if it's the one being changed
    if (selectedElement && 'position' in selectedElement && selectedElement.id === nodeId) {
      setSelectedElement(prev => prev ? {...prev, data: {...prev.data, ...data}} : null);
    }
  }, [setNodes, selectedElement]);

  const updateEdgeData = useCallback((edgeId: string, data: Partial<EdgeData>) => {
    setEdges((eds) =>
      eds.map((edge) =>
        edge.id === edgeId ? { ...edge, data: { ...edge.data, ...data } } : edge
      )
    );
     if (selectedElement && !('position' in selectedElement) && selectedElement.id === edgeId) {
      setSelectedElement(prev => prev ? {...prev, data: {...prev.data, ...data}} : null);
    }
  }, [setEdges, selectedElement]);

  const clearNetwork = useCallback(() => {
    setNodes([]);
    setEdges([]);
    setSelectedElement(null);
    setSimulationResults(null);
    toast({ title: 'Network Cleared', description: 'Canvas has been reset.' });
  }, [setNodes, setEdges, toast]);

  const loadExample = useCallback((data: { nodes: Node<NodeData>[], edges: Edge<EdgeData>[] }) => {
     // Ensure nodes have the correct type and edges have markers
     const typedNodes = data.nodes.map(n => ({ ...n, type: 'custom' }));
     const markedEdges = data.edges.map(e => ({ ...e, markerEnd: { type: MarkerType.ArrowClosed } }));

    setNodes(typedNodes);
    setEdges(markedEdges);
    setSelectedElement(null);
    setSimulationResults(null);

     // Set default source/target for the loaded example
     if (typedNodes.length > 0) {
         setSimulationParams(prev => ({
             ...prev,
             sourceNode: typedNodes[0].id,
             targetNode: typedNodes.length > 1 ? typedNodes[typedNodes.length - 1].id : typedNodes[0].id,
         }));
     } else {
          setSimulationParams(prev => ({ ...prev, sourceNode: null, targetNode: null }));
     }

    toast({ title: 'Example Loaded', description: 'Network topology updated.' });
  }, [setNodes, setEdges, toast, setSimulationParams]);


  const deleteSelectedElement = useCallback(() => {
    if (!selectedElement) {
       toast({ title: 'No element selected', description: 'Click on a node or edge to select it first.', variant: 'destructive'});
      return;
    }

    if ('position' in selectedElement) { // It's a Node
      setNodes((nds) => nds.filter((node) => node.id !== selectedElement.id));
      // Remove edges connected to the deleted node
      setEdges((eds) => eds.filter((edge) => edge.source !== selectedElement.id && edge.target !== selectedElement.id));
      toast({ title: 'Node Deleted', description: `Node ${selectedElement.data.label || selectedElement.id} and its connections removed.` });
    } else { // It's an Edge
      setEdges((eds) => eds.filter((edge) => edge.id !== selectedElement.id));
       toast({ title: 'Edge Deleted', description: `Edge ${selectedElement.id} removed.` });
    }
    setSelectedElement(null);
  }, [selectedElement, setNodes, setEdges, toast]);


  const runSimulation = useCallback(() => {
     if (!simulationParams.sourceNode || !simulationParams.targetNode) {
       toast({ title: 'Simulation Error', description: 'Please select source and target nodes.', variant: 'destructive' });
       return;
     }
      if (simulationParams.sourceNode === simulationParams.targetNode) {
         toast({ title: 'Simulation Error', description: 'Source and target nodes cannot be the same.', variant: 'destructive' });
         return;
      }

    if (simulationParams.algorithm === 'adaptive' || simulationParams.algorithm === 'compare') {
        const totalWeight = Object.values(simulationParams.weights).reduce((sum, w) => sum + w, 0);
        if (Math.abs(totalWeight - 1) > 0.001) {
            toast({ title: 'Simulation Error', description: 'Adaptive weights (α, β, γ) must sum to 1.', variant: 'destructive' });
            return;
        }
    }


    // Placeholder for actual simulation logic
    // In a real app, this would likely involve API calls to a backend (e.g., Python with NetworkX)
    console.log('Running simulation with params:', simulationParams);
    console.log('Current network:', { nodes, edges });

    // --- Mock Simulation Results ---
    const algorithmsToRun = simulationParams.algorithm === 'compare'
        ? ['dijkstra', 'bellman-ford', 'adaptive']
        : [simulationParams.algorithm];

    const results: SimulationResult[] = algorithmsToRun.map(algo => {
        // Mock path finding (simple shortest path based on edge count for demo)
         const mockPath = [simulationParams.sourceNode!, simulationParams.targetNode!]; // Simplified
         if (nodes.length > 2) {
            // Add a random intermediate node if available
            const intermediateNodes = nodes.filter(n => n.id !== simulationParams.sourceNode && n.id !== simulationParams.targetNode);
            if (intermediateNodes.length > 0) {
                mockPath.splice(1, 0, intermediateNodes[Math.floor(Math.random() * intermediateNodes.length)].id);
            }
         }


        // Mock metrics based loosely on algorithm type
        let energyFactor = 1;
        let latencyFactor = 1;
        let deliveryFactor = 1;
        let lifetimeFactor = 1;

        if (algo === 'dijkstra') {
            latencyFactor = 0.8; // Often fast
            energyFactor = 1.1;
        } else if (algo === 'bellman-ford') {
            latencyFactor = 1.2; // Can be slower
            energyFactor = 1.0;
        } else { // adaptive
             latencyFactor = 0.9 + Math.random() * 0.3; // Variable based on weights
             energyFactor = 0.9 + Math.random() * 0.2; // Tries to optimize
             deliveryFactor = 1.05; // More robust?
             lifetimeFactor = 1.1; // Aims for longevity?
        }

        return {
            algorithm: algo,
            path: mockPath,
            metrics: {
                energyConsumption: (100 + Math.random() * 50) * energyFactor,
                averageLatency: (20 + Math.random() * 30) * latencyFactor,
                deliveryRatio: Math.min(1, (0.9 + Math.random() * 0.1) * deliveryFactor),
                networkLifetime: Math.floor((500 + Math.random() * 200) * lifetimeFactor),
            },
        };
    });
    // --- End Mock Simulation Results ---

    setSimulationResults(results);

    // Highlight the path for the first result (or selected algorithm if not comparing)
    const firstResultPath = results[0].path;
    const pathEdges = new Set<string>();
     for (let i = 0; i < firstResultPath.length - 1; i++) {
        const source = firstResultPath[i];
        const target = firstResultPath[i+1];
        const edge = edges.find(e => (e.source === source && e.target === target) || (e.source === target && e.target === source)); // Find edge regardless of direction for highlighting
        if (edge) {
            pathEdges.add(edge.id);
        }
     }

    setEdges(eds => eds.map(e => ({
        ...e,
        style: {
             stroke: pathEdges.has(e.id) ? 'hsl(var(--accent))' : 'hsl(var(--primary))',
             strokeWidth: pathEdges.has(e.id) ? 3 : 2,
        },
        animated: pathEdges.has(e.id), // Optional: Animate the path edges
    })));


    toast({
      title: 'Simulation Complete',
      description: `Results generated for ${simulationParams.algorithm === 'compare' ? 'all algorithms' : simulationParams.algorithm}.`,
    });
  }, [nodes, edges, simulationParams, setEdges, toast]);


  return (
    <NetworkContext.Provider
      value={{
        nodes,
        setNodes,
        onNodesChange,
        edges,
        setEdges,
        onEdgesChange,
        selectedElement,
        setSelectedElement,
        updateNodeData,
        updateEdgeData,
        simulationParams,
        setSimulationParams,
        simulationResults,
        runSimulation,
        clearNetwork,
        loadExample,
        deleteSelectedElement,
      }}
    >
      {children}
    </NetworkContext.Provider>
  );
};

// Custom hook to use the context
export const useNetwork = (): NetworkContextType => {
  const context = useContext(NetworkContext);
  if (context === undefined) {
    throw new Error('useNetwork must be used within a NetworkProvider');
  }
  return context;
};
