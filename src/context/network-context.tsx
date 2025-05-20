
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
const initialEdges: Edge<EdgeData>[] = exampleScenarios[0].data.edges.map(e => ({
    ...e,
    style: { stroke: 'hsl(var(--primary))', strokeWidth: 2 }, // Default style for initial load
    animated: false,
}));


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
     let newSourceNode = simulationParams.sourceNode;
     let newTargetNode = simulationParams.targetNode;

     if (newSourceNode && !nodeIds.includes(newSourceNode)) {
       newSourceNode = nodeIds[0] || null;
     }
     if (newTargetNode && !nodeIds.includes(newTargetNode)) {
       newTargetNode = nodeIds[nodeIds.length - 1] || null;
     }
     
     // Ensure source and target are different if possible, and both exist
    if (nodeIds.length > 0) {
        if (!newSourceNode) newSourceNode = nodeIds[0];
        if (!newTargetNode && nodeIds.length > 1) newTargetNode = nodeIds[1];
        else if (!newTargetNode) newTargetNode = nodeIds[0];


        if (newSourceNode === newTargetNode && nodeIds.length > 1) {
            const alternativeTarget = nodeIds.find(id => id !== newSourceNode);
            if (alternativeTarget) {
                newTargetNode = alternativeTarget;
            }
        }
    } else {
        newSourceNode = null;
        newTargetNode = null;
    }


     if (newSourceNode !== simulationParams.sourceNode || newTargetNode !== simulationParams.targetNode) {
        setSimulationParams(prev => ({ 
            ...prev, 
            sourceNode: newSourceNode, 
            targetNode: newTargetNode 
        }));
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
     const typedNodes = data.nodes.map(n => ({ ...n, type: 'custom' }));
     // Add default styles and ensure type for all edges when loading an example
     const styledMarkedEdges = data.edges.map(e => ({
         ...e,
         type: e.type || 'default', // Ensure type is set
         markerEnd: { type: MarkerType.ArrowClosed },
         style: { stroke: 'hsl(var(--primary))', strokeWidth: 2 }, // Default style
         animated: false, // Ensure not animated by default
     }));

    setNodes(typedNodes);
    setEdges(styledMarkedEdges); // Use edges with default styles
    setSelectedElement(null);
    setSimulationResults(null); // Clear previous results

     // Set initial source/target; useEffect will refine if needed
     if (typedNodes.length > 0) {
         setSimulationParams(prev => ({
             ...prev,
             sourceNode: typedNodes[0].id,
             targetNode: typedNodes.length > 1 ? typedNodes[typedNodes.length -1].id : typedNodes[0].id,
         }));
     } else {
          setSimulationParams(prev => ({ ...prev, sourceNode: null, targetNode: null }));
     }

    toast({ title: 'Example Loaded', description: 'Network topology updated.' });
  }, [setNodes, setEdges, setSimulationParams, toast]);


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

    console.log('Running simulation with params:', simulationParams);
    console.log('Current network:', { nodes, edges });

    const algorithmsToRun = simulationParams.algorithm === 'compare'
        ? ['dijkstra', 'bellman-ford', 'adaptive']
        : [simulationParams.algorithm];

    const results: SimulationResult[] = algorithmsToRun.map(algo => {
         const mockPath = [simulationParams.sourceNode!, simulationParams.targetNode!]; 
         if (nodes.length > 2) {
            const intermediateNodes = nodes.filter(n => n.id !== simulationParams.sourceNode && n.id !== simulationParams.targetNode);
            if (intermediateNodes.length > 0) {
                mockPath.splice(1, 0, intermediateNodes[Math.floor(Math.random() * intermediateNodes.length)].id);
            }
         }

        let energyFactor = 1;
        let latencyFactor = 1;
        let deliveryFactor = 1;
        let lifetimeFactor = 1;

        if (algo === 'dijkstra') {
            latencyFactor = 0.8; 
            energyFactor = 1.1;
        } else if (algo === 'bellman-ford') {
            latencyFactor = 1.2; 
            energyFactor = 1.0;
        } else { 
             latencyFactor = (0.9 + Math.random() * 0.3) * (1 - simulationParams.weights.alpha + 0.5) ; 
             energyFactor = (0.9 + Math.random() * 0.2) * (1 - simulationParams.weights.beta + 0.5); 
             deliveryFactor = (1.0 + Math.random() * 0.1) * (1 - simulationParams.weights.gamma + 0.5);
             lifetimeFactor = 1.1; 
        }
        
        // Simulate metrics based on path length and factors
        const pathLength = mockPath.length -1; // number of edges in path
        const baseEnergyPerHop = 10;
        const baseLatencyPerHop = 15;

        return {
            algorithm: algo,
            path: mockPath,
            metrics: {
                energyConsumption: (baseEnergyPerHop * pathLength + Math.random() * 20) * energyFactor,
                averageLatency: (baseLatencyPerHop * pathLength + Math.random() * 10) * latencyFactor,
                deliveryRatio: Math.min(1, (0.85 + Math.random() * 0.15) * deliveryFactor),
                networkLifetime: Math.floor((300 + Math.random() * 100) * lifetimeFactor / (pathLength || 1)),
            },
        };
    });

    setSimulationResults(results);

    const firstResultPath = results.find(r => r.algorithm === simulationParams.algorithm)?.path || results[0].path;
    const pathEdges = new Set<string>();
     for (let i = 0; i < firstResultPath.length - 1; i++) {
        const source = firstResultPath[i];
        const target = firstResultPath[i+1];
        const edge = edges.find(e => (e.source === source && e.target === target) || (e.source === target && e.target === source)); 
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
        animated: pathEdges.has(e.id),
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

