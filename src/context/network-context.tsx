
'use client';

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import type {
  Node,
  Edge,
  OnNodesChange,
  OnEdgesChange,
} from 'reactflow';
import {
  useNodesState,
  useEdgesState,
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
  isFailed?: boolean;
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
  networkLifetime: number;
}

export interface SimulationResult {
  algorithm: string;
  path: string[];
  metrics: PerformanceMetricsData;
}

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
  toggleNodeFailState: (nodeId: string) => void;
}

const NetworkContext = createContext<NetworkContextType | undefined>(undefined);

const initialNodes: Node<NodeData>[] = exampleScenarios[0].data.nodes.map(n => ({ ...n, type: 'custom', data: { ...n.data, isFailed: n.data.isFailed || false } }));
const initialEdges: Edge<EdgeData>[] = exampleScenarios[0].data.edges.map(e => ({
    ...e,
    type: e.type || 'default',
    markerEnd: { type: MarkerType.ArrowClosed },
    style: { stroke: 'hsl(var(--primary))', strokeWidth: 2 },
    animated: false,
}));


// Helper function for BFS pathfinding - respects failed nodes and edge direction
const findPathBFS = (
  sourceId: string,
  targetId: string,
  allNodes: Node<NodeData>[],
  allEdges: Edge<EdgeData>[]
): string[] => {
  if (!sourceId || !targetId) return [];
  if (sourceId === targetId) return [sourceId];

  const sourceNodeDetails = allNodes.find(n => n.id === sourceId);
  const targetNodeDetails = allNodes.find(n => n.id === targetId);

  // Check if source or target itself is failed
  if (sourceNodeDetails?.data.isFailed || targetNodeDetails?.data.isFailed) {
    return [];
  }

  const adj: Record<string, string[]> = {};
  const validNodes = allNodes.filter(node => !node.data.isFailed);
  const validNodeIds = new Set(validNodes.map(n => n.id));

  if (!validNodeIds.has(sourceId) || !validNodeIds.has(targetId)) {
    return [];
  }

  validNodes.forEach(node => adj[node.id] = []);

  allEdges.forEach(edge => {
    // Ensure both source and target of the edge are valid (not failed)
    const sourceIsValid = validNodeIds.has(edge.source);
    const targetIsValid = validNodeIds.has(edge.target);

    if (sourceIsValid && targetIsValid) {
        // Strictly directed: only add edge.source -> edge.target
        if (!adj[edge.source]) adj[edge.source] = [];
        adj[edge.source].push(edge.target);
    }
  });

  const queue: string[][] = [[sourceId]];
  const visited = new Set<string>([sourceId]);

  while (queue.length > 0) {
    const currentPath = queue.shift()!;
    const currentNodeId = currentPath[currentPath.length - 1];

    if (currentNodeId === targetId) {
      return currentPath;
    }

    (adj[currentNodeId] || []).forEach(neighborId => {
      if (!visited.has(neighborId)) {
        visited.add(neighborId);
        const newPath = [...currentPath, neighborId];
        queue.push(newPath);
      }
    });
  }
  return []; // No path found
};


export const NetworkProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [nodes, setNodes, onNodesChange] = useNodesState<NodeData>(initialNodes.map(n => ({...n, data: {...n.data, isFailed: n.data.isFailed || false}})));
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
    const activeNodes = nodes.filter(n => !n.data.isFailed);
    const activeNodeIds = activeNodes.map(n => n.id);

    let newSourceNode = simulationParams.sourceNode;
    let newTargetNode = simulationParams.targetNode;
    let paramsChanged = false;

    if (activeNodeIds.length === 0) {
      if (newSourceNode !== null) { newSourceNode = null; paramsChanged = true; }
      if (newTargetNode !== null) { newTargetNode = null; paramsChanged = true; }
    } else {
      if (newSourceNode === null || !activeNodeIds.includes(newSourceNode)) {
        newSourceNode = activeNodeIds[0];
        paramsChanged = true;
      }
      if (newTargetNode === null || !activeNodeIds.includes(newTargetNode)) {
        newTargetNode = activeNodeIds.length > 1 ? activeNodeIds.find(id => id !== newSourceNode) || activeNodeIds[0] : newSourceNode;
        paramsChanged = true;
      }
      if (newSourceNode === newTargetNode && activeNodeIds.length > 1) {
        const alternativeTarget = activeNodeIds.find(id => id !== newSourceNode);
        if (alternativeTarget) {
          newTargetNode = alternativeTarget;
          paramsChanged = true;
        }
      }
    }

    if (paramsChanged) {
      setSimulationParams(prev => ({
        ...prev,
        sourceNode: newSourceNode,
        targetNode: newTargetNode,
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

  const clearVisualPath = useCallback(() => {
    setEdges(eds => eds.map(e => ({
        ...e,
        style: { ...e.style, stroke: 'hsl(var(--primary))', strokeWidth: 2 },
        animated: false,
    })));
  }, [setEdges]);

  const handleSimulationStateChange = useCallback((messageTitle: string, messageDescription: string, variant: 'default' | 'destructive' = 'default') => {
    clearVisualPath();
    setSimulationResults(null);
    toast({ title: messageTitle, description: messageDescription, variant });
  }, [clearVisualPath, toast, setSimulationResults]);


  const toggleNodeFailState = useCallback((nodeId: string) => {
    let nodeLabel = nodeId;
    setNodes(nds => nds.map(n => {
      if (n.id === nodeId) {
        nodeLabel = n.data.label || n.id;
        return { ...n, data: { ...n.data, isFailed: !n.data.isFailed } };
      }
      return n;
    }));
    const nodeNowFailed = !nodes.find(n => n.id === nodeId)?.data.isFailed; // State after toggle
    handleSimulationStateChange(
      'Node State Changed',
      `Node ${nodeLabel} is now ${nodeNowFailed ? 'FAILED' : 'RESTORED'}. Run simulation to see updated paths.`,
      nodeNowFailed ? 'destructive' : 'default'
    );
    if (selectedElement && 'position' in selectedElement && selectedElement.id === nodeId) {
      setSelectedElement(prev => prev ? {...prev, data: {...prev.data, isFailed: nodeNowFailed}} : null);
    }
  }, [nodes, setNodes, handleSimulationStateChange, selectedElement]);


  const clearNetwork = useCallback(() => {
    setNodes([]);
    setEdges([]);
    setSelectedElement(null);
    handleSimulationStateChange('Network Cleared', 'Canvas has been reset.');
  }, [setNodes, setEdges, handleSimulationStateChange]);

  const loadExample = useCallback((data: { nodes: Node<NodeData>[], edges: Edge<EdgeData>[] }) => {
     const typedNodes = data.nodes.map(n => ({ ...n, type: 'custom', data: {...n.data, isFailed: n.data.isFailed || false} }));
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
    handleSimulationStateChange('Example Loaded', 'Network topology updated. Run simulation to see paths.');
  }, [setNodes, setEdges, handleSimulationStateChange]);


  const deleteSelectedElement = useCallback(() => {
    if (!selectedElement) {
       toast({ title: 'No element selected', description: 'Click on a node or edge to select it first.', variant: 'destructive'});
      return;
    }
    if ('position' in selectedElement) { // Node
      setNodes((nds) => nds.filter((node) => node.id !== selectedElement.id));
      setEdges((eds) => eds.filter((edge) => edge.source !== selectedElement.id && edge.target !== selectedElement.id));
    } else { // Edge
      setEdges((eds) => eds.filter((edge) => edge.id !== selectedElement.id));
    }
    setSelectedElement(null);
    handleSimulationStateChange('Element Deleted', 'Network updated. Run simulation to see new paths.');
  }, [selectedElement, setNodes, setEdges, toast, handleSimulationStateChange]);

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
    const spacing = 180;
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
      const nodeX = (i % nodesPerRow) * spacing + 50;
      const nodeY = Math.floor(i / nodesPerRow) * spacing + 50;
      const nodeId = `m_node_${i}`;
      newGeneratedNodes.push({
        id: nodeId,
        type: 'custom',
        position: { x: nodeX, y: nodeY },
        data: {
          id: nodeId,
          label: `Node ${String.fromCharCode(65 + (i % 26))}${i >= 26 ? Math.floor(i/26) : ''}`,
          battery: 100,
          queueSize: 0,
          role: 'sensor',
          isSelected: false,
          isFailed: false,
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
            data: { latency: 10, bandwidth: 100 },
          });
        }
      }
    }
    setNodes(newGeneratedNodes);
    setEdges(newGeneratedEdges);
    setSelectedElement(null);
    handleSimulationStateChange('Network Generated', `${numNodes} nodes and ${newGeneratedEdges.length} edges created. Run simulation.`);
  }, [setNodes, setEdges, setSelectedElement, toast, handleSimulationStateChange]);


  const runSimulation = useCallback(() => {
    const { sourceNode: sourceId, targetNode: targetId, algorithm, weights } = simulationParams;

     if (!sourceId || !targetId) {
       toast({ title: 'Simulation Error', description: 'Please select source and target nodes.', variant: 'destructive' });
       setSimulationResults(null);
       clearVisualPath();
       return;
     }

     const sourceNodeDetails = nodes.find(n => n.id === sourceId);
     const targetNodeDetails = nodes.find(n => n.id === targetId);

     if (sourceNodeDetails?.data.isFailed) {
        toast({ title: 'Simulation Error', description: 'Source node has failed. Cannot run simulation.', variant: 'destructive' });
        setSimulationResults(null);
        clearVisualPath();
        return;
     }
     if (targetNodeDetails?.data.isFailed) {
        toast({ title: 'Simulation Error', description: 'Target node has failed. Cannot run simulation.', variant: 'destructive' });
        setSimulationResults(null);
        clearVisualPath();
        return;
     }

    if (sourceId === targetId && nodes.filter(n=>!n.data.isFailed).length >= 1) {
        const selfPathResult: SimulationResult = {
            algorithm: algorithm === 'compare' ? 'adaptive' : algorithm, // Default to adaptive for display in compare
            path: [sourceId],
            metrics: { energyConsumption: 0, averageLatency: 0, deliveryRatio: 1, networkLifetime: 500 }
        };
        setSimulationResults(algorithm === 'compare' ? [
            {...selfPathResult, algorithm: 'dijkstra'},
            {...selfPathResult, algorithm: 'bellman-ford'},
            {...selfPathResult, algorithm: 'adaptive'},
        ] : [selfPathResult]);
        clearVisualPath(); // Clear any previous path highlights
        // No edges to highlight for a self-path
        toast({ title: 'Simulation Complete', description: `Source and target are the same node: ${sourceNodeDetails?.data.label || sourceId}.` });
        return;
    }

    if (algorithm === 'adaptive' || algorithm === 'compare') {
        const totalWeight = Object.values(weights).reduce((sum, w) => sum + w, 0);
        if (Math.abs(totalWeight - 1) > 0.001) {
            toast({ title: 'Simulation Error', description: 'Adaptive weights (α, β, γ) must sum to 1.', variant: 'destructive' });
            setSimulationResults(null);
            clearVisualPath();
            return;
        }
    }

    const algorithmsToRun = algorithm === 'compare'
        ? ['dijkstra', 'bellman-ford', 'adaptive']
        : [algorithm];

    const results: SimulationResult[] = algorithmsToRun.map(algo => {
        let currentMockPath: string[] = [];

        // Ensure we use the current state of nodes and edges
        const currentNodes = nodes;
        const currentEdges = edges;

        if (algo === 'adaptive') {
            let bestAdaptivePath: string[] = [];
            let minCost = Infinity;

            // 1. Check direct path S -> T
            const directEdge = currentEdges.find(edge =>
                edge.source === sourceId && edge.target === targetId &&
                !currentNodes.find(n => n.id === edge.source)?.data.isFailed &&
                !currentNodes.find(n => n.id === edge.target)?.data.isFailed
            );

            if (directEdge?.data) {
                const sourceNodeData = currentNodes.find(n => n.id === sourceId)?.data;
                if (sourceNodeData) { // Needed for perceived values, though not directly used for 1-hop cost here
                     minCost = (directEdge.data.latency * weights.alpha); // Simplified cost for direct
                     bestAdaptivePath = [sourceId, targetId];
                }
            }

            // 2. Check 2-hop paths S -> I -> T
            const intermediateNodeCandidates = currentNodes.filter(node =>
                node.id !== sourceId && node.id !== targetId && !node.data.isFailed
            );

            for (const intermediateNode of intermediateNodeCandidates) {
                const edge1 = currentEdges.find(e =>
                    e.source === sourceId && e.target === intermediateNode.id &&
                    !currentNodes.find(n => n.id === e.source)?.data.isFailed &&
                    !currentNodes.find(n => n.id === e.target)?.data.isFailed
                );
                const edge2 = currentEdges.find(e =>
                    e.source === intermediateNode.id && e.target === targetId &&
                    !currentNodes.find(n => n.id === e.source)?.data.isFailed &&
                    !currentNodes.find(n => n.id === e.target)?.data.isFailed
                );

                if (edge1?.data && edge2?.data && intermediateNode?.data) {
                    const perceivedBattery = Math.max(0, Math.min(100, intermediateNode.data.battery - Math.floor(Math.random() * 5) + 2)); // Slight random variance
                    const perceivedQueueSize = Math.max(0, intermediateNode.data.queueSize + Math.floor(Math.random() * 6) - 3); // Slight random variance

                    const pathLatency = (edge1.data.latency + edge2.data.latency);
                    const latencyCost = weights.alpha * pathLatency;
                    const batteryUnhealthiness = 100 - perceivedBattery;
                    const batteryCost = weights.beta * batteryUnhealthiness;
                    const queueCost = weights.gamma * perceivedQueueSize;
                    const totalCost = latencyCost + batteryCost + queueCost;

                    if (totalCost < minCost) {
                        minCost = totalCost;
                        bestAdaptivePath = [sourceId, intermediateNode.id, targetId];
                    }
                }
            }
            currentMockPath = bestAdaptivePath;
            if (currentMockPath.length === 0 && sourceId !== targetId) { // Fallback to BFS if no 1 or 2-hop path found
                currentMockPath = findPathBFS(sourceId, targetId, currentNodes, currentEdges);
            }
        } else { // Dijkstra, Bellman-Ford (simplified mock)
            // 1. Check direct path S -> T
            const directEdge = currentEdges.find(edge =>
                edge.source === sourceId && edge.target === targetId &&
                !currentNodes.find(n => n.id === edge.source)?.data.isFailed &&
                !currentNodes.find(n => n.id === edge.target)?.data.isFailed
            );
            if (directEdge) {
                 currentMockPath = [sourceId, targetId];
            } else {
                // 2. Check 2-hop paths S -> I -> T
                let foundTwoHop = false;
                const intermediateNodeCandidates = currentNodes.filter(node =>
                    node.id !== sourceId && node.id !== targetId && !node.data.isFailed
                );
                for (const intermediateNode of intermediateNodeCandidates) {
                    const edge1Exists = currentEdges.some(edge =>
                        edge.source === sourceId && edge.target === intermediateNode.id &&
                        !currentNodes.find(n => n.id === edge.source)?.data.isFailed &&
                        !currentNodes.find(n => n.id === edge.target)?.data.isFailed
                    );
                    const edge2Exists = currentEdges.some(edge =>
                        edge.source === intermediateNode.id && edge.target === targetId &&
                        !currentNodes.find(n => n.id === edge.source)?.data.isFailed &&
                        !currentNodes.find(n => n.id === edge.target)?.data.isFailed
                    );
                    if (edge1Exists && edge2Exists) {
                        currentMockPath = [sourceId, intermediateNode.id, targetId];
                        foundTwoHop = true;
                        break;
                    }
                }
                if (!foundTwoHop && sourceId !== targetId) { // Fallback to BFS
                    currentMockPath = findPathBFS(sourceId, targetId, currentNodes, currentEdges);
                }
            }
        }

        let energyFactor = 1;
        let latencyFactor = 1;
        let deliveryFactor = 1;
        let lifetimeFactor = 1;

        if (algo === 'dijkstra') {
            latencyFactor = 0.8; energyFactor = 1.1; deliveryFactor = 0.95; lifetimeFactor = 0.9;
        } else if (algo === 'bellman-ford') {
            latencyFactor = 1.2; energyFactor = 1.0; deliveryFactor = 0.9; lifetimeFactor = 0.85;
        } else if (algo === 'adaptive') {
             const pathLatencySum = currentMockPath.length > 1 ?
                currentMockPath.slice(0, -1).reduce((acc, curr, idx) => {
                    const nextNodeId = currentMockPath[idx+1];
                    const edge = currentEdges.find(e => e.source === curr && e.target === nextNodeId);
                    return acc + (edge?.data?.latency || 30); // Use a default if edge not found (should not happen with BFS)
                }, 0)
                : 0;
             const avgPathLatency = pathLatencySum / Math.max(1, currentMockPath.length - 1);
             latencyFactor = Math.max(0.1, avgPathLatency / 20); // Normalize based on avg latency
             energyFactor = 1.0 - (weights.beta * 0.2) + (weights.gamma * 0.1);
             deliveryFactor = Math.min(1.0, 0.9 + (weights.alpha * 0.05) - (weights.gamma * 0.1));
             lifetimeFactor = 0.85 + (weights.beta * 0.25);
        }

        const pathLength = currentMockPath.length > 0 ? Math.max(0, currentMockPath.length -1) : 0;
        const baseEnergyPerHop = 10;
        const baseLatencyPerHop = 15;
        const noPathExists = currentMockPath.length === 0 && sourceId !== targetId;

        return {
            algorithm: algo,
            path: currentMockPath,
            metrics: {
                energyConsumption: noPathExists ? Infinity : (pathLength === 0 ? 0 : Math.max(5, (baseEnergyPerHop * pathLength + Math.random() * 20) * energyFactor)),
                averageLatency: noPathExists ? Infinity : (pathLength === 0 ? 0 : Math.max(5, (baseLatencyPerHop * pathLength + Math.random() * 10) * latencyFactor)),
                deliveryRatio: noPathExists ? 0 : (pathLength === 0 ? 1 : Math.min(1, Math.max(0, (0.85 + Math.random() * 0.15) * deliveryFactor))),
                networkLifetime: noPathExists ? 0 : (pathLength === 0 ? 500 : Math.max(10, Math.floor((300 + Math.random() * 100) * lifetimeFactor / Math.max(1,pathLength)))),
            },
        };
    });

    setSimulationResults(results);

    const chosenAlgorithmForDisplay = algorithm === 'compare' ? 'adaptive' : algorithm;
    const resultForDisplay = results.find(r => r.algorithm === chosenAlgorithmForDisplay) || results[0];
    const pathEdgesToHighlight = new Set<string>();

     if (resultForDisplay && resultForDisplay.path.length > 1) {
        for (let i = 0; i < resultForDisplay.path.length - 1; i++) {
            const pathSource = resultForDisplay.path[i];
            const pathTarget = resultForDisplay.path[i+1];
            // For highlighting, we find the edge regardless of its original direction if it connects the two path nodes
            // However, the path itself was determined by directed logic.
            const edge = edges.find(e => (e.source === pathSource && e.target === pathTarget)); // Strict direction for finding the edge to highlight
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

    const pathFoundForDisplay = resultForDisplay && resultForDisplay.path.length > 0;
    const displayedAlgoName = resultForDisplay?.algorithm || chosenAlgorithmForDisplay;

    toast({
      title: 'Simulation Complete',
      description: pathFoundForDisplay
        ? `Results generated. Displaying path for ${displayedAlgoName}.`
        : `No path found for ${displayedAlgoName} from ${sourceNodeDetails?.data.label || sourceId} to ${targetNodeDetails?.data.label || targetId}.`,
       variant: pathFoundForDisplay ? 'default' : 'destructive'
    });
  }, [nodes, edges, simulationParams, setEdges, toast, setSimulationResults, clearVisualPath]);


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
        toggleNodeFailState,
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

    