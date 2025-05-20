
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

// Initial state - Load first example by default
const initialNodes: Node<NodeData>[] = exampleScenarios[0].data.nodes.map(n => ({ ...n, type: 'custom' }));
const initialEdges: Edge<EdgeData>[] = exampleScenarios[0].data.edges.map(e => ({
    ...e,
    type: e.type || 'default',
    markerEnd: { type: MarkerType.ArrowClosed },
    style: { stroke: 'hsl(var(--primary))', strokeWidth: 2 }, 
    animated: false,
}));


export const NetworkProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [nodes, setNodes, onNodesChange] = useNodesState<NodeData>(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState<EdgeData>(initialEdges);
  const [selectedElement, setSelectedElement] = useState<Node<NodeData> | Edge<EdgeData> | null>(null);
  const [simulationParams, setSimulationParams] = useState<SimulationParams>({
    algorithm: 'adaptive',
    sourceNode: initialNodes.length > 0 ? initialNodes[0].id : null,
    targetNode: initialNodes.length > 1 ? initialNodes[initialNodes.length - 1].id : initialNodes.length > 0 ? initialNodes[0].id : null,
    weights: { alpha: 0.4, beta: 0.3, gamma: 0.3 },
  });
  const [simulationResults, setSimulationResults] = useState<SimulationResult[] | null>(null);
  const { toast } = useToast();

  useEffect(() => {
     const nodeIds = nodes.map(n => n.id);
     let newSourceNode = simulationParams.sourceNode;
     let newTargetNode = simulationParams.targetNode;

     if (newSourceNode && !nodeIds.includes(newSourceNode)) {
       newSourceNode = nodeIds[0] || null;
     }
     if (newTargetNode && !nodeIds.includes(newTargetNode)) {
       newTargetNode = nodeIds.length > 1 ? nodeIds[nodeIds.length-1] : (nodeIds[0] || null);
     }
     
    if (nodeIds.length > 0) {
        if (!newSourceNode) newSourceNode = nodeIds[0];
        if (!newTargetNode) newTargetNode = nodeIds.length > 1 ? nodeIds[nodeIds.length-1] : nodeIds[0];

        if (newSourceNode === newTargetNode && nodeIds.length > 1) {
            const alternativeTarget = nodeIds.find(id => id !== newSourceNode);
            if (alternativeTarget) {
                newTargetNode = alternativeTarget;
            }
        } else if (nodeIds.length === 1) {
            newTargetNode = newSourceNode; // if only one node, source and target are same
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
    setSimulationParams(prev => ({ ...prev, sourceNode: null, targetNode: null }));
    toast({ title: 'Network Cleared', description: 'Canvas has been reset.' });
  }, [setNodes, setEdges, toast]);

  const loadExample = useCallback((data: { nodes: Node<NodeData>[], edges: Edge<EdgeData>[] }) => {
     const typedNodes = data.nodes.map(n => ({ ...n, type: 'custom' }));
     const styledMarkedEdges = data.edges.map(e => ({
         ...e,
         type: e.type || 'default', 
         markerEnd: { type: MarkerType.ArrowClosed },
         style: { stroke: 'hsl(var(--primary))', strokeWidth: 2 }, 
         animated: false, 
     }));

    setNodes(typedNodes);
    setEdges(styledMarkedEdges); 
    setSelectedElement(null);
    setSimulationResults(null); 

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

    if ('position' in selectedElement) { 
      setNodes((nds) => nds.filter((node) => node.id !== selectedElement.id));
      setEdges((eds) => eds.filter((edge) => edge.source !== selectedElement.id && edge.target !== selectedElement.id));
      toast({ title: 'Node Deleted', description: `Node ${selectedElement.data.label || selectedElement.id} and its connections removed.` });
    } else { 
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

    const algorithmsToRun = simulationParams.algorithm === 'compare'
        ? ['dijkstra', 'bellman-ford', 'adaptive']
        : [simulationParams.algorithm];

    const results: SimulationResult[] = algorithmsToRun.map(algo => {
        let currentMockPath: string[] = [];
        const sourceId = simulationParams.sourceNode!;
        const targetId = simulationParams.targetNode!;
        const { weights } = simulationParams;

        if (algo === 'adaptive') {
            let bestAdaptivePath: string[] = [sourceId, targetId]; // Default to direct if no better path
            let minCost = Infinity;

            const directEdge = edges.find(edge =>
                (edge.source === sourceId && edge.target === targetId) ||
                (edge.source === targetId && edge.target === sourceId)
            );

            // Evaluate 2-hop paths
            const intermediateNodeCandidates = nodes.filter(node => node.id !== sourceId && node.id !== targetId);
            for (const intermediateNode of intermediateNodeCandidates) {
                const edge1 = edges.find(e =>
                    (e.source === sourceId && e.target === intermediateNode.id) ||
                    (e.source === intermediateNode.id && e.target === sourceId)
                );
                const edge2 = edges.find(e =>
                    (e.source === intermediateNode.id && e.target === targetId) ||
                    (e.source === targetId && e.target === intermediateNode.id)
                );

                if (edge1?.data && edge2?.data && intermediateNode?.data) {
                    const latencyCost = weights.alpha * (edge1.data.latency + edge2.data.latency);
                    const batteryCost = weights.beta * (100 - intermediateNode.data.battery); // Higher battery is better, so (100-bat) is cost
                    const queueCost = weights.gamma * intermediateNode.data.queueSize;
                    const totalCost = latencyCost + batteryCost + queueCost;

                    if (totalCost < minCost) {
                        minCost = totalCost;
                        bestAdaptivePath = [sourceId, intermediateNode.id, targetId];
                    }
                }
            }
            
            if (minCost !== Infinity) { // A 2-hop path was found and is better or the only option
                currentMockPath = bestAdaptivePath;
            } else if (directEdge) { // No suitable 2-hop path, but a direct edge exists
                currentMockPath = [sourceId, targetId];
            } else { // No 2-hop and no direct edge
                currentMockPath = [sourceId, targetId]; // Path will not highlight if no edge
            }

        } else { // For Dijkstra, Bellman-Ford (simple mock path)
            currentMockPath = [sourceId, targetId]; 
            const directEdgeExists = edges.some(edge =>
                (edge.source === sourceId && edge.target === targetId) ||
                (edge.source === targetId && edge.target === sourceId)
            );

            if (!directEdgeExists) {
                const intermediateNodeCandidates = nodes.filter(node => node.id !== sourceId && node.id !== targetId);
                for (const intermediateNode of intermediateNodeCandidates) {
                    const edge1Exists = edges.some(edge =>
                        (edge.source === sourceId && edge.target === intermediateNode.id) ||
                        (edge.source === intermediateNode.id && edge.target === sourceId)
                    );
                    const edge2Exists = edges.some(edge =>
                        (edge.source === intermediateNode.id && edge.target === targetId) ||
                        (edge.source === targetId && edge.target === intermediateNode.id)
                    );
                    if (edge1Exists && edge2Exists) {
                        currentMockPath = [sourceId, intermediateNode.id, targetId];
                        break; 
                    }
                }
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
        } else if (algo === 'adaptive') { 
             // Metrics for adaptive path should ideally be derived from the chosen path's properties
             // For now, keep randomized factors but influenced by weights
             latencyFactor = (0.9 + Math.random() * 0.3) * (1 - weights.alpha * 0.5); 
             energyFactor = (0.9 + Math.random() * 0.2) * (1 + weights.beta * 0.3); // Higher beta weight might reduce energy consumption slightly in a real scenario
             deliveryFactor = (0.95 + Math.random() * 0.05) * (1 - weights.gamma * 0.2); // Higher gamma weight might improve delivery by avoiding congested queues
             lifetimeFactor = 1.0 + weights.beta * 0.2; // Higher battery focus might increase lifetime
        }
        
        const pathLength = Math.max(1, currentMockPath.length -1); 
        const baseEnergyPerHop = 10;
        const baseLatencyPerHop = 15;

        return {
            algorithm: algo,
            path: currentMockPath,
            metrics: {
                energyConsumption: (baseEnergyPerHop * pathLength + Math.random() * 20) * energyFactor,
                averageLatency: (baseLatencyPerHop * pathLength + Math.random() * 10) * latencyFactor,
                deliveryRatio: Math.min(1, (0.85 + Math.random() * 0.15) * deliveryFactor),
                networkLifetime: Math.floor((300 + Math.random() * 100) * lifetimeFactor / pathLength),
            },
        };
    });

    setSimulationResults(results);

    const chosenAlgorithmForDisplay = simulationParams.algorithm === 'compare' ? 'adaptive' : simulationParams.algorithm;
    const resultForDisplay = results.find(r => r.algorithm === chosenAlgorithmForDisplay) || results[0];
    const pathEdgesToHighlight = new Set<string>();

     if (resultForDisplay && resultForDisplay.path.length > 1) {
        for (let i = 0; i < resultForDisplay.path.length - 1; i++) {
            const source = resultForDisplay.path[i];
            const target = resultForDisplay.path[i+1];
            const edge = edges.find(e => (e.source === source && e.target === target) || (e.source === target && e.target === source)); 
            if (edge) {
                pathEdgesToHighlight.add(edge.id);
            }
        }
     }


    setEdges(eds => eds.map(e => ({
        ...e,
        style: {
             stroke: pathEdgesToHighlight.has(e.id) ? 'hsl(var(--accent))' : 'hsl(var(--primary))',
             strokeWidth: pathEdgesToHighlight.has(e.id) ? 3 : 2,
        },
        animated: pathEdgesToHighlight.has(e.id),
    })));


    toast({
      title: 'Simulation Complete',
      description: `Results generated for ${simulationParams.algorithm === 'compare' ? 'all algorithms' : simulationParams.algorithm}. Displaying path for ${chosenAlgorithmForDisplay}.`,
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

export const useNetwork = (): NetworkContextType => {
  const context = useContext(NetworkContext);
  if (context === undefined) {
    throw new Error('useNetwork must be used within a NetworkProvider');
  }
  return context;
};

