
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

// Helper function for BFS pathfinding - respects failed nodes
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

  if (sourceNodeDetails?.data.isFailed || targetNodeDetails?.data.isFailed) {
    return [];
  }

  const adj: Record<string, string[]> = {};
  const validNodes = allNodes.filter(node => !node.data.isFailed);

  validNodes.forEach(node => adj[node.id] = []);

  allEdges.forEach(edge => {
    const sourceIsValid = validNodes.some(n => n.id === edge.source && !n.data.isFailed);
    const targetIsValid = validNodes.some(n => n.id === edge.target && !n.data.isFailed);

    if (sourceIsValid && targetIsValid) {
        adj[edge.source].push(edge.target);
        adj[edge.target].push(edge.source); // Treat edges as bidirectional for BFS path discovery
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
        const neighborNode = allNodes.find(n => n.id === neighborId); // Check if neighbor itself is failed (redundant if adj list is correct)
        if (neighborNode && !neighborNode.data.isFailed) {
            visited.add(neighborId);
            const newPath = [...currentPath, neighborId];
            queue.push(newPath);
        }
      }
    });
  }
  return [];
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
  const [simulationTriggerToken, setSimulationTriggerToken] = useState(0);
  const { toast } = useToast();

  const [matrixSize, setMatrixSize] = useState<number>(3);
  const [matrixInput, setMatrixInput] = useState<string>('0,1,0\n0,0,1\n1,0,0');

  // Effect to update source/target nodes if they become invalid (e.g., due to deletion or failure)
  useEffect(() => {
    const activeNodeIds = nodes.filter(n => !n.data.isFailed).map(n => n.id);
    let currentSource = simulationParams.sourceNode;
    let currentTarget = simulationParams.targetNode;
    let changed = false;

    if (currentSource && !activeNodeIds.includes(currentSource)) {
      currentSource = activeNodeIds[0] || null;
      changed = true;
    } else if (!currentSource && activeNodeIds.length > 0) {
      currentSource = activeNodeIds[0];
      changed = true;
    }

    if (currentTarget && !activeNodeIds.includes(currentTarget)) {
      currentTarget = activeNodeIds.length > 1 ? activeNodeIds.find(id => id !== currentSource) || activeNodeIds[0] || null : activeNodeIds[0] || null;
      changed = true;
    } else if (!currentTarget && activeNodeIds.length > 0) {
      currentTarget = activeNodeIds.length > 1 ? activeNodeIds.find(id => id !== currentSource) || activeNodeIds[0] : activeNodeIds[0];
      changed = true;
    }

    if (activeNodeIds.length > 0 && currentSource === currentTarget) {
        if (activeNodeIds.length === 1) {
            // Only one active node, source and target must be it
            if(simulationParams.targetNode !== currentSource) { // only update if target was different
                currentTarget = currentSource;
                changed = true;
            }
        } else {
            // More than one active node, try to find a different target
            const alternativeTarget = activeNodeIds.find(id => id !== currentSource);
            if (alternativeTarget && currentTarget !== alternativeTarget) {
                currentTarget = alternativeTarget;
                changed = true;
            } else if (!alternativeTarget && currentTarget !== null) { // Should not happen if length > 1
                currentTarget = null; // Or handle as error
                changed = true;
            }
        }
    } else if (activeNodeIds.length === 0) {
        if(currentSource !== null || currentTarget !== null) {
            currentSource = null;
            currentTarget = null;
            changed = true;
        }
    }

    if (changed) {
      setSimulationParams(prev => ({
        ...prev,
        sourceNode: currentSource,
        targetNode: currentTarget,
      }));
    }
  }, [nodes, simulationParams.sourceNode, simulationParams.targetNode, setSimulationParams]);


  // Effect to run simulation when trigger token changes or source/target nodes change
  useEffect(() => {
    if (simulationTriggerToken > 0) { // Run only if explicitly triggered
      // Ensure sourceNode and targetNode are up-to-date from simulationParams
      if (simulationParams.sourceNode && simulationParams.targetNode) {
         runSimulation();
      } else if (nodes.length > 0 && (!simulationParams.sourceNode || !simulationParams.targetNode)) {
        // This case might occur if the effect setting source/target hasn't stabilized yet.
        // Or if there are no valid nodes to select.
        // Consider if a default toast is needed here or if runSimulation handles it.
        // For now, runSimulation will handle the toast if source/target are null.
        runSimulation();
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [simulationTriggerToken, simulationParams.sourceNode, simulationParams.targetNode]); // Removed runSimulation from deps


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

  const triggerSimulation = useCallback(() => {
    setSimulationTriggerToken(prev => prev + 1);
  }, []);

  const toggleNodeFailState = useCallback((nodeId: string) => {
    let nodeLabel = nodeId;
    setNodes(nds => nds.map(n => {
      if (n.id === nodeId) {
        nodeLabel = n.data.label || n.id;
        return { ...n, data: { ...n.data, isFailed: !n.data.isFailed } };
      }
      return n;
    }));

    const nodeWasFailed = nodes.find(n => n.id === nodeId)?.data.isFailed;

    setEdges(eds => eds.map(e => ({
      ...e,
      style: { stroke: 'hsl(var(--primary))', strokeWidth: 2 },
      animated: false,
    })));
    setSimulationResults(null);

    toast({
      title: 'Node State Changed',
      description: `Node ${nodeLabel} is now ${!nodeWasFailed ? 'FAILED' : 'RESTORED'}. Re-simulating...`,
      variant: !nodeWasFailed ? 'destructive' : 'default',
    });
    
    if (selectedElement && 'position' in selectedElement && selectedElement.id === nodeId) {
      setSelectedElement(prev => prev ? {...prev, data: {...prev.data, isFailed: !prev.data.isFailed}} : null);
    }
    triggerSimulation();
  }, [nodes, setNodes, setEdges, toast, triggerSimulation, selectedElement]);


  const clearNetwork = useCallback(() => {
    setNodes([]);
    setEdges([]);
    setSelectedElement(null);
    setSimulationResults(null);
    setSimulationParams(prev => ({ ...prev, sourceNode: null, targetNode: null }));
    toast({ title: 'Network Cleared', description: 'Canvas has been reset.' });
  }, [setNodes, setEdges, toast]);

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
    setSimulationResults(null);

     const validNodesForExample = typedNodes.filter(n => !n.data.isFailed);
     if (validNodesForExample.length > 0) {
         setSimulationParams(prev => ({
             ...prev,
             sourceNode: validNodesForExample[0].id,
             targetNode: validNodesForExample.length > 1 ? validNodesForExample[validNodesForExample.length -1].id : validNodesForExample[0].id,
         }));
     } else {
          setSimulationParams(prev => ({ ...prev, sourceNode: null, targetNode: null }));
     }
    toast({ title: 'Example Loaded', description: 'Network topology updated.' });
    triggerSimulation(); // Trigger simulation after loading example
  }, [setNodes, setEdges, setSimulationParams, toast, triggerSimulation]);


  const deleteSelectedElement = useCallback(() => {
    if (!selectedElement) {
       toast({ title: 'No element selected', description: 'Click on a node or edge to select it first.', variant: 'destructive'});
      return;
    }
    let elementRemoved = false;
    if ('position' in selectedElement) { // Node
      setNodes((nds) => nds.filter((node) => node.id !== selectedElement.id));
      setEdges((eds) => eds.filter((edge) => edge.source !== selectedElement.id && edge.target !== selectedElement.id));
      toast({ title: 'Node Deleted', description: `Node ${selectedElement.data.label || selectedElement.id} and its connections removed.` });
      elementRemoved = true;
    } else { // Edge
      setEdges((eds) => eds.filter((edge) => edge.id !== selectedElement.id));
      toast({ title: 'Edge Deleted', description: `Edge ${selectedElement.id} removed.` });
      elementRemoved = true;
    }
    setSelectedElement(null);
    if (elementRemoved) {
        setEdges(eds => eds.map(e => ({ // Reset styles
            ...e,
            style: { stroke: 'hsl(var(--primary))', strokeWidth: 2 },
            animated: false,
        })));
        setSimulationResults(null);
        triggerSimulation();
    }
  }, [selectedElement, setNodes, setEdges, toast, triggerSimulation]);

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
    triggerSimulation();
  }, [setNodes, setEdges, setSelectedElement, setSimulationResults, setSimulationParams, toast, triggerSimulation]);


  const runSimulation = useCallback(() => {
    // Use current state directly from context/hooks for nodes and edges
    const currentNodes = nodes;
    const currentEdges = edges;
    const { sourceNode: sourceId, targetNode: targetId, algorithm, weights } = simulationParams;

     if (!sourceId || !targetId) {
       toast({ title: 'Simulation Error', description: 'Please select source and target nodes.', variant: 'destructive' });
       setSimulationResults(null); // Clear any previous results if params are invalid
       setEdges(eds => eds.map(e => ({ // Reset edge styles
          ...e,
          style: { stroke: 'hsl(var(--primary))', strokeWidth: 2 },
          animated: false,
        })));
       return;
     }

     const sourceNodeDetails = currentNodes.find(n => n.id === sourceId);
     const targetNodeDetails = currentNodes.find(n => n.id === targetId);

     if (sourceNodeDetails?.data.isFailed) {
        toast({ title: 'Simulation Error', description: 'Source node has failed. Cannot run simulation.', variant: 'destructive' });
        setSimulationResults(null);
        setEdges(eds => eds.map(e => ({ ...e, style: { stroke: 'hsl(var(--primary))', strokeWidth: 2 }, animated: false })));
        return;
     }
     if (targetNodeDetails?.data.isFailed) {
        toast({ title: 'Simulation Error', description: 'Target node has failed. Cannot run simulation.', variant: 'destructive' });
        setSimulationResults(null);
        setEdges(eds => eds.map(e => ({ ...e, style: { stroke: 'hsl(var(--primary))', strokeWidth: 2 }, animated: false })));
        return;
     }

      if (sourceId === targetId && currentNodes.filter(n=>!n.data.isFailed).length > 1) {
         toast({ title: 'Simulation Error', description: 'Source and target nodes cannot be the same if multiple non-failed nodes exist.', variant: 'destructive' });
         setSimulationResults(null);
         setEdges(eds => eds.map(e => ({ ...e, style: { stroke: 'hsl(var(--primary))', strokeWidth: 2 }, animated: false })));
         return;
      }

    if (algorithm === 'adaptive' || algorithm === 'compare') {
        const totalWeight = Object.values(weights).reduce((sum, w) => sum + w, 0);
        if (Math.abs(totalWeight - 1) > 0.001) {
            toast({ title: 'Simulation Error', description: 'Adaptive weights (α, β, γ) must sum to 1.', variant: 'destructive' });
            setSimulationResults(null);
            setEdges(eds => eds.map(e => ({ ...e, style: { stroke: 'hsl(var(--primary))', strokeWidth: 2 }, animated: false })));
            return;
        }
    }

    const algorithmsToRun = algorithm === 'compare'
        ? ['dijkstra', 'bellman-ford', 'adaptive']
        : [algorithm];

    const results: SimulationResult[] = algorithmsToRun.map(algo => {
        let currentMockPath: string[] = [];

        const sourceNodeData = currentNodes.find(n => n.id === sourceId)?.data;
        const targetNodeData = currentNodes.find(n => n.id === targetId)?.data;


        if (sourceId === targetId) {
            currentMockPath = [sourceId];
        } else if (algo === 'adaptive') {
            let bestAdaptivePath: string[] = [];
            let minCost = Infinity;

            // Check direct path
            const directEdge = currentEdges.find(edge =>
                ((edge.source === sourceId && edge.target === targetId) ||
                 (edge.source === targetId && edge.target === sourceId)) &&
                !currentNodes.find(n => n.id === edge.source)?.data.isFailed &&
                !currentNodes.find(n => n.id === edge.target)?.data.isFailed
            );

            if (directEdge?.data && sourceNodeData && targetNodeData) {
                const directPathCost = (directEdge.data.latency * weights.alpha);
                minCost = directPathCost;
                bestAdaptivePath = [sourceId, targetId];
            }

            // Check 2-hop paths
            const intermediateNodeCandidates = currentNodes.filter(node =>
                node.id !== sourceId && node.id !== targetId && !node.data.isFailed
            );

            for (const intermediateNode of intermediateNodeCandidates) {
                const edge1 = currentEdges.find(e =>
                    ((e.source === sourceId && e.target === intermediateNode.id) ||
                     (e.source === intermediateNode.id && e.target === sourceId)) &&
                    !currentNodes.find(n => n.id === e.source)?.data.isFailed &&
                    !currentNodes.find(n => n.id === e.target)?.data.isFailed
                );
                const edge2 = currentEdges.find(e =>
                    ((e.source === intermediateNode.id && e.target === targetId) ||
                     (e.source === targetId && e.target === intermediateNode.id)) &&
                    !currentNodes.find(n => n.id === e.source)?.data.isFailed &&
                    !currentNodes.find(n => n.id === e.target)?.data.isFailed
                );

                if (edge1?.data && edge2?.data && intermediateNode?.data) {
                    const perceivedBattery = Math.max(0, Math.min(100, intermediateNode.data.battery - Math.floor(Math.random() * 5)));
                    const perceivedQueueSize = Math.max(0, intermediateNode.data.queueSize + Math.floor(Math.random() * 6) - 3);

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
            if (currentMockPath.length === 0 && sourceId !== targetId) {
                currentMockPath = findPathBFS(sourceId, targetId, currentNodes, currentEdges);
            }
        } else { // Dijkstra, Bellman-Ford (simple mock path with BFS fallback)
            const directEdge = currentEdges.find(edge =>
                ((edge.source === sourceId && edge.target === targetId) ||
                 (edge.source === targetId && edge.target === sourceId)) &&
                !currentNodes.find(n => n.id === edge.source)?.data.isFailed &&
                !currentNodes.find(n => n.id === edge.target)?.data.isFailed
            );
            if (directEdge) {
                 currentMockPath = [sourceId, targetId];
            } else {
                let foundTwoHop = false;
                const intermediateNodeCandidates = currentNodes.filter(node =>
                    node.id !== sourceId && node.id !== targetId && !node.data.isFailed
                );
                for (const intermediateNode of intermediateNodeCandidates) {
                    const edge1Exists = currentEdges.some(edge =>
                        ((edge.source === sourceId && edge.target === intermediateNode.id) ||
                         (edge.source === intermediateNode.id && edge.target === sourceId)) &&
                        !currentNodes.find(n => n.id === edge.source)?.data.isFailed &&
                        !currentNodes.find(n => n.id === edge.target)?.data.isFailed
                    );
                    const edge2Exists = currentEdges.some(edge => // Typo was here: 'e' instead of 'edge'
                        ((edge.source === intermediateNode.id && edge.target === targetId) ||
                         (edge.source === targetId && edge.target === intermediateNode.id)) &&
                        !currentNodes.find(n => n.id === edge.source)?.data.isFailed &&
                        !currentNodes.find(n => n.id === edge.target)?.data.isFailed
                    );
                    if (edge1Exists && edge2Exists) {
                        currentMockPath = [sourceId, intermediateNode.id, targetId];
                        foundTwoHop = true;
                        break;
                    }
                }
                if (!foundTwoHop && sourceId !== targetId) {
                    currentMockPath = findPathBFS(sourceId, targetId, currentNodes, currentEdges);
                }
            }
        }

        if (currentMockPath.length === 0 && sourceId === targetId) {
            currentMockPath = [sourceId];
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
                    const nextNode = currentMockPath[idx+1];
                    const edge = currentEdges.find(e => (e.source === curr && e.target === nextNode) || (e.source === nextNode && e.target === curr));
                    return acc + (edge?.data?.latency || 30);
                }, 0)
                : (sourceId === targetId ? 0 : (currentEdges.find(e => (e.source === sourceId && e.target === targetId) || (e.source === targetId && e.target === sourceId))?.data?.latency || 30));

             const avgPathLatency = pathLatencySum / Math.max(1, currentMockPath.length - 1);
             latencyFactor = Math.max(0.1, avgPathLatency / 20);
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
            const edge = currentEdges.find(e => (e.source === pathSource && e.target === pathTarget) || (e.source === pathTarget && e.target === pathSource));
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

    toast({
      title: 'Simulation Complete',
      description: pathFoundForDisplay
        ? `Results generated for ${algorithm === 'compare' ? 'all algorithms' : algorithm}. Displaying path for ${chosenAlgorithmForDisplay}.`
        : `No path found for ${chosenAlgorithmForDisplay} from ${sourceNodeDetails?.data.label || sourceId} to ${targetNodeDetails?.data.label || targetId}.`,
       variant: pathFoundForDisplay ? 'default' : 'destructive'
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nodes, edges, simulationParams, setEdges, toast, setSimulationResults]); // Removed triggerSimulation from here


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
        runSimulation: triggerSimulation, // Expose triggerSimulation as runSimulation for the button
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

    