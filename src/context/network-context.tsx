
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
  matrixSize: number;
  setMatrixSize: React.Dispatch<React.SetStateAction<number>>;
  matrixInput: string;
  setMatrixInput: React.Dispatch<React.SetStateAction<string>>;
  generateNetworkFromMatrix: (matrixStr: string, numNodes: number) => void;
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

  const [matrixSize, setMatrixSize] = useState<number>(3);
  const [matrixInput, setMatrixInput] = useState<string>('0,1,0\n0,0,1\n1,0,0');


  useEffect(() => {
     const nodeIds = nodes.map(n => n.id);
     let newSourceNode = simulationParams.sourceNode;
     let newTargetNode = simulationParams.targetNode;

     if (newSourceNode && !nodeIds.includes(newSourceNode)) {
       newSourceNode = nodeIds[0] || null;
     } else if (!newSourceNode && nodeIds.length > 0) {
       newSourceNode = nodeIds[0];
     }

     if (newTargetNode && !nodeIds.includes(newTargetNode)) {
       newTargetNode = nodeIds.length > 1 ? nodeIds[nodeIds.length-1] : (nodeIds[0] || null);
     } else if (!newTargetNode && nodeIds.length > 0) {
        newTargetNode = nodeIds.length > 1 ? nodeIds[nodeIds.length-1] : nodeIds[0];
     }
     
    if (nodeIds.length > 0) {
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

  }, [nodes, simulationParams.sourceNode, simulationParams.targetNode, setSimulationParams]);


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

  const generateNetworkFromMatrix = useCallback((matrixStr: string, numNodes: number) => {
    if (numNodes <= 0) {
      toast({ title: 'Invalid Matrix Size', description: 'Number of nodes must be positive.', variant: 'destructive' });
      return;
    }

    const rows = matrixStr.trim().split('\n');
    if (rows.length !== numNodes) {
      toast({ title: 'Matrix Error', description: `Matrix must have ${numNodes} rows. Found ${rows.length}.`, variant: 'destructive' });
      return;
    }

    const newGeneratedNodes: Node<NodeData>[] = [];
    const newGeneratedEdges: Edge<EdgeData>[] = [];
    const adjMatrix: number[][] = [];

    const spacing = 180; // Spacing between nodes in the grid
    const nodesPerRow = Math.max(1, Math.ceil(Math.sqrt(numNodes)));


    for (let i = 0; i < numNodes; i++) {
      const cols = rows[i].split(',').map(val => val.trim());
      if (cols.length !== numNodes) {
        toast({ title: 'Matrix Error', description: `Row ${i + 1} must have ${numNodes} columns. Found ${cols.length}.`, variant: 'destructive' });
        return;
      }
      const numericRow: number[] = [];
      for (let j = 0; j < numNodes; j++) {
        const val = parseInt(cols[j], 10);
        if (isNaN(val) || (val !== 0 && val !== 1)) {
          toast({ title: 'Matrix Error', description: `Invalid value '${cols[j]}' at row ${i + 1}, col ${j + 1}. Must be 0 or 1.`, variant: 'destructive' });
          return;
        }
        numericRow.push(val);
      }
      adjMatrix.push(numericRow);

      const nodeX = (i % nodesPerRow) * spacing + 50; // Add offset to avoid edge of canvas
      const nodeY = Math.floor(i / nodesPerRow) * spacing + 50;
      const nodeId = `m_node_${i}`;
      newGeneratedNodes.push({
        id: nodeId,
        type: 'custom',
        position: { x: nodeX, y: nodeY },
        data: {
          id: nodeId,
          label: `Node ${String.fromCharCode(65 + (i % 26))}${i >= 26 ? Math.floor(i/26) : ''}`, // A, B..Z, A1, B1..
          battery: 100,
          queueSize: 0,
          role: 'sensor', 
          isSelected: false,
        },
      });
    }

    for (let i = 0; i < numNodes; i++) {
      for (let j = 0; j < numNodes; j++) {
        if (adjMatrix[i][j] === 1) {
          const sourceNodeId = `m_node_${i}`;
          const targetNodeId = `m_node_${j}`;
          newGeneratedEdges.push({
            id: `m_edge_${i}-${j}`,
            source: sourceNodeId,
            target: targetNodeId,
            type: 'default',
            markerEnd: { type: MarkerType.ArrowClosed },
            style: { stroke: 'hsl(var(--primary))', strokeWidth: 2 },
            animated: false,
            data: { latency: 10, bandwidth: 100 }, // Default edge data
          });
        }
      }
    }

    setNodes(newGeneratedNodes);
    setEdges(newGeneratedEdges);
    setSelectedElement(null);
    setSimulationResults(null);

    if (newGeneratedNodes.length > 0) {
      setSimulationParams(prev => ({
        ...prev,
        sourceNode: newGeneratedNodes[0].id,
        targetNode: newGeneratedNodes.length > 1 ? newGeneratedNodes[newGeneratedNodes.length - 1].id : newGeneratedNodes[0].id,
      }));
    } else {
      setSimulationParams(prev => ({ ...prev, sourceNode: null, targetNode: null }));
    }
    toast({ title: 'Network Generated', description: `${numNodes} nodes and ${newGeneratedEdges.length} edges created from matrix.` });

  }, [setNodes, setEdges, setSelectedElement, setSimulationResults, setSimulationParams, toast]);


  const runSimulation = useCallback(() => {
     if (!simulationParams.sourceNode || !simulationParams.targetNode) {
       toast({ title: 'Simulation Error', description: 'Please select source and target nodes.', variant: 'destructive' });
       return;
     }
      if (simulationParams.sourceNode === simulationParams.targetNode && nodes.length > 1) { // Allow if only one node exists
         toast({ title: 'Simulation Error', description: 'Source and target nodes cannot be the same if multiple nodes exist.', variant: 'destructive' });
         return;
      }

    if (simulationParams.algorithm === 'adaptive' || simulationParams.algorithm === 'compare') {
        const totalWeight = Object.values(simulationParams.weights).reduce((sum, w) => sum + w, 0);
        if (Math.abs(totalWeight - 1) > 0.001) { // Use a small tolerance for float precision
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

        // Attempt to find a direct edge first
        const directEdge = edges.find(edge =>
            (edge.source === sourceId && edge.target === targetId) ||
            (edge.source === targetId && edge.target === sourceId) // Consider undirected for path finding purpose
        );

        if (algo === 'adaptive') {
            let bestAdaptivePath: string[] = directEdge ? [sourceId, targetId] : [];
            let minCost = directEdge ? (directEdge.data?.latency || 0) * weights.alpha : Infinity; // Initial cost if direct path exists

            const sourceNodeData = nodes.find(n => n.id === sourceId)?.data;
            const targetNodeData = nodes.find(n => n.id === targetId)?.data;

            if (sourceNodeData && targetNodeData) {
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
                        const pathLatency = (edge1.data.latency + edge2.data.latency);
                        const intermediateBattery = intermediateNode.data.battery;
                        const intermediateQueue = intermediateNode.data.queueSize;
                        
                        // Cost calculation: lower is better
                        // Latency cost: higher latency = higher cost
                        const latencyCost = weights.alpha * pathLatency;
                        // Battery cost: lower battery = higher cost. We invert it (100 - battery) and normalize if needed.
                        // Let's assume battery is 0-100. (100 - battery) can be a proxy for "unhealthiness".
                        const batteryUnhealthiness = 100 - intermediateBattery;
                        const batteryCost = weights.beta * batteryUnhealthiness;
                        // Queue cost: higher queue size = higher cost
                        const queueCost = weights.gamma * intermediateQueue;
                        
                        const totalCost = latencyCost + batteryCost + queueCost;

                        if (totalCost < minCost) {
                            minCost = totalCost;
                            bestAdaptivePath = [sourceId, intermediateNode.id, targetId];
                        }
                    }
                }
            }
             currentMockPath = bestAdaptivePath.length > 0 ? bestAdaptivePath : [sourceId, targetId];


        } else { // For Dijkstra, Bellman-Ford (simple mock path)
            if (directEdge) {
                 currentMockPath = [sourceId, targetId];
            } else {
                 // Try to find a 2-hop path if no direct edge
                const intermediateNodeCandidates = nodes.filter(node => node.id !== sourceId && node.id !== targetId);
                let foundTwoHop = false;
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
                        foundTwoHop = true;
                        break;
                    }
                }
                if (!foundTwoHop) {
                    currentMockPath = [sourceId, targetId]; // Default to source-target, may not highlight if no direct edge
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
            deliveryFactor = 0.95;
            lifetimeFactor = 0.9;
        } else if (algo === 'bellman-ford') {
            latencyFactor = 1.2;
            energyFactor = 1.0;
            deliveryFactor = 0.9;
            lifetimeFactor = 0.85;
        } else if (algo === 'adaptive') {
             const pathLatencySum = currentMockPath.length > 1 ?
                currentMockPath.slice(0, -1).reduce((acc, curr, idx) => {
                    const nextNode = currentMockPath[idx+1];
                    const edge = edges.find(e => (e.source === curr && e.target === nextNode) || (e.source === nextNode && e.target === curr));
                    return acc + (edge?.data?.latency || 30); // Default high latency if edge not found for some reason
                }, 0)
                : 30; // Default if path is just source-target with no actual edge in currentMockPath segment
             const avgPathLatency = pathLatencySum / Math.max(1, currentMockPath.length - 1);

             latencyFactor = avgPathLatency / 20; // Normalize against a baseline latency
             energyFactor = 1.0 - (weights.beta * 0.2) + (weights.gamma * 0.1); // Beta reduces, gamma slightly increases
             deliveryFactor = 0.9 + (weights.alpha * 0.05) - (weights.gamma * 0.1); // Alpha slightly improves, gamma penalizes
             lifetimeFactor = 0.85 + (weights.beta * 0.25);
        }

        const pathLength = Math.max(1, currentMockPath.length -1);
        const baseEnergyPerHop = 10;
        const baseLatencyPerHop = 15;

        return {
            algorithm: algo,
            path: currentMockPath,
            metrics: {
                energyConsumption: Math.max(5, (baseEnergyPerHop * pathLength + Math.random() * 20) * energyFactor),
                averageLatency: Math.max(5, (baseLatencyPerHop * pathLength + Math.random() * 10) * latencyFactor),
                deliveryRatio: Math.min(1, Math.max(0, (0.85 + Math.random() * 0.15) * deliveryFactor)),
                networkLifetime: Math.max(10, Math.floor((300 + Math.random() * 100) * lifetimeFactor / pathLength)),
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
        matrixSize,
        setMatrixSize,
        matrixInput,
        setMatrixInput,
        generateNetworkFromMatrix,
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

