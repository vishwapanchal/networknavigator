
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
  isFailed?: boolean; // New property for node failure
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
  toggleNodeFailState: (nodeId: string) => void; // New function
}

const NetworkContext = createContext<NetworkContextType | undefined>(undefined);

// Initial state - Load first example by default
const initialNodes: Node<NodeData>[] = exampleScenarios[0].data.nodes.map(n => ({ ...n, type: 'custom', data: { ...n.data, isFailed: false } }));
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
  if (sourceId === targetId) return [sourceId]; // Path to self is just the node

  const sourceNode = allNodes.find(n => n.id === sourceId);
  const targetNode = allNodes.find(n => n.id === targetId);

  if (sourceNode?.data.isFailed || targetNode?.data.isFailed) {
    return []; // Cannot path to/from a failed critical endpoint
  }

  const adj: Record<string, string[]> = {};
  const validNodes = allNodes.filter(node => !node.data.isFailed);

  validNodes.forEach(node => adj[node.id] = []);

  allEdges.forEach(edge => {
    const sourceExists = validNodes.some(n => n.id === edge.source);
    const targetExists = validNodes.some(n => n.id === edge.target);

    if (sourceExists && targetExists) {
        adj[edge.source].push(edge.target);
        adj[edge.target].push(edge.source); // Assuming undirected for BFS path discovery
    }
  });

  const queue: string[][] = [[sourceId]];
  const visited = new Set<string>([sourceId]);

  while (queue.length > 0) {
    const currentPath = queue.shift()!;
    const currentNodeId = currentPath[currentPath.length - 1];

    if (currentNodeId === targetId) {
      return currentPath; // Found path
    }

    (adj[currentNodeId] || []).forEach(neighborId => {
      if (!visited.has(neighborId)) {
        // Ensure neighbor itself is not failed (already filtered by validNodes for adj list, but good for robustness)
        const neighborNode = allNodes.find(n => n.id === neighborId);
        if (neighborNode && !neighborNode.data.isFailed) {
            visited.add(neighborId);
            const newPath = [...currentPath, neighborId];
            queue.push(newPath);
        }
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
     const currentNodes = nodes.filter(n => !n.data.isFailed); // Consider only non-failed nodes for source/target
     const nodeIds = currentNodes.map(n => n.id);

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
            newTargetNode = newSourceNode; 
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

  const toggleNodeFailState = useCallback((nodeId: string) => {
    let nodeLabel = nodeId;
    setNodes(nds => nds.map(n => {
      if (n.id === nodeId) {
        nodeLabel = n.data.label || n.id;
        return { ...n, data: { ...n.data, isFailed: !n.data.isFailed } };
      }
      return n;
    }));

    const nodeWasFailed = nodes.find(n => n.id === nodeId)?.data.isFailed; // State before toggle

    toast({
      title: 'Node State Changed',
      description: `Node ${nodeLabel} is now ${!nodeWasFailed ? 'FAILED' : 'RESTORED'}.`,
      variant: !nodeWasFailed ? 'destructive' : 'default',
    });

    // If a path was displayed, clear it as it might be invalid now
    if (simulationResults) {
      setSimulationResults(null);
      setEdges(eds => eds.map(e => ({
        ...e,
        style: { stroke: 'hsl(var(--primary))', strokeWidth: 2 },
        animated: false,
      })));
      toast({
        title: 'Path Cleared',
        description: 'Node failure/restoration may have invalidated the previous path. Please re-run simulation.',
      });
    }
    // Update selected element if it's the one being toggled
     if (selectedElement && 'position' in selectedElement && selectedElement.id === nodeId) {
      setSelectedElement(prev => prev ? {...prev, data: {...prev.data, isFailed: !prev.data.isFailed}} : null);
    }

  }, [nodes, setNodes, simulationResults, setEdges, toast, selectedElement]);


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
  }, [setNodes, setEdges, setSimulationParams, toast]);


  const deleteSelectedElement = useCallback(() => {
    if (!selectedElement) {
       toast({ title: 'No element selected', description: 'Click on a node or edge to select it first.', variant: 'destructive'});
      return;
    }

    if ('position' in selectedElement) { // Node
      setNodes((nds) => nds.filter((node) => node.id !== selectedElement.id));
      setEdges((eds) => eds.filter((edge) => edge.source !== selectedElement.id && edge.target !== selectedElement.id));
      toast({ title: 'Node Deleted', description: `Node ${selectedElement.data.label || selectedElement.id} and its connections removed.` });
    } else { // Edge
      setEdges((eds) => eds.filter((edge) => edge.id !== selectedElement.id));
       toast({ title: 'Edge Deleted', description: `Edge ${selectedElement.id} removed.` });
    }
    setSelectedElement(null);
    // Clear simulation results if an element is deleted
    if (simulationResults) {
        setSimulationResults(null);
        setEdges(eds => eds.map(e => ({
            ...e,
            style: { stroke: 'hsl(var(--primary))', strokeWidth: 2 },
            animated: false,
        })));
    }
  }, [selectedElement, setNodes, setEdges, simulationResults, toast]);

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

  }, [setNodes, setEdges, setSelectedElement, setSimulationResults, setSimulationParams, toast]);


  const runSimulation = useCallback(() => {
     if (!simulationParams.sourceNode || !simulationParams.targetNode) {
       toast({ title: 'Simulation Error', description: 'Please select source and target nodes.', variant: 'destructive' });
       return;
     }

     const sourceNodeDetails = nodes.find(n => n.id === simulationParams.sourceNode);
     const targetNodeDetails = nodes.find(n => n.id === simulationParams.targetNode);

     if (sourceNodeDetails?.data.isFailed) {
        toast({ title: 'Simulation Error', description: 'Source node has failed. Cannot run simulation.', variant: 'destructive' });
        return;
     }
     if (targetNodeDetails?.data.isFailed) {
        toast({ title: 'Simulation Error', description: 'Target node has failed. Cannot run simulation.', variant: 'destructive' });
        return;
     }

      if (simulationParams.sourceNode === simulationParams.targetNode && nodes.filter(n=>!n.data.isFailed).length > 1) { 
         toast({ title: 'Simulation Error', description: 'Source and target nodes cannot be the same if multiple non-failed nodes exist.', variant: 'destructive' });
         return;
      }

    if (simulationParams.algorithm === 'adaptive' || simulationParams.algorithm === 'compare') {
        const totalWeight = Object.values(simulationParams.weights).reduce((sum, w) => sum + w, 0);
        if (Math.abs(totalWeight - 1) > 0.001) { 
            toast({ title: 'Simulation Error', description: 'Adaptive weights (α, β, γ) must sum to 1.', variant: 'destructive' });
            return;
        }
    }
    
    const activeNodes = nodes.filter(n => !n.data.isFailed); // Use only non-failed nodes for simulation

    const algorithmsToRun = simulationParams.algorithm === 'compare'
        ? ['dijkstra', 'bellman-ford', 'adaptive']
        : [simulationParams.algorithm];

    const results: SimulationResult[] = algorithmsToRun.map(algo => {
        let currentMockPath: string[] = [];
        const sourceId = simulationParams.sourceNode!;
        const targetId = simulationParams.targetNode!;
        const { weights } = simulationParams;

        const sourceNodeData = activeNodes.find(n => n.id === sourceId)?.data;
        const targetNodeData = activeNodes.find(n => n.id === targetId)?.data;

        if (sourceId === targetId) {
            currentMockPath = [sourceId];
        } else if (algo === 'adaptive') {
            let bestAdaptivePath: string[] = [];
            let minCost = Infinity;
            
            // Evaluate direct path first
            const directEdge = edges.find(edge =>
                ((edge.source === sourceId && edge.target === targetId) ||
                 (edge.source === targetId && edge.target === sourceId)) 
            );

            if (directEdge?.data && sourceNodeData && targetNodeData) {
                 // Simplified direct cost for now, could be expanded
                const directPathCost = (directEdge.data.latency * weights.alpha);
                minCost = directPathCost;
                bestAdaptivePath = [sourceId, targetId];
            }
            
            const intermediateNodeCandidates = activeNodes.filter(node => node.id !== sourceId && node.id !== targetId);
            for (const intermediateNode of intermediateNodeCandidates) {
                // Skip if intermediate node is failed (already filtered by activeNodes, but good for clarity)
                // if (intermediateNode.data.isFailed) continue; 

                const edge1 = edges.find(e =>
                    (e.source === sourceId && e.target === intermediateNode.id) ||
                    (e.source === intermediateNode.id && e.target === sourceId)
                );
                const edge2 = edges.find(e =>
                    (e.source === intermediateNode.id && e.target === targetId) ||
                    (e.source === targetId && e.target === intermediateNode.id)
                );

                if (edge1?.data && edge2?.data && intermediateNode?.data) {
                    // Introduce randomness for perceived values
                    const perceivedBattery = Math.max(0, Math.min(100, intermediateNode.data.battery - Math.floor(Math.random() * 10))); // Could be slightly less
                    const perceivedQueueSize = Math.max(0, intermediateNode.data.queueSize + Math.floor(Math.random() * 10) - 5); // Could be slightly more or less

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
                currentMockPath = findPathBFS(sourceId, targetId, activeNodes, edges);
            }

        } else { // For Dijkstra, Bellman-Ford (simple mock path with BFS fallback)
            const directEdge = edges.find(edge =>
                ((edge.source === sourceId && edge.target === targetId) ||
                 (edge.source === targetId && edge.target === sourceId)) 
            );
            if (directEdge) {
                 currentMockPath = [sourceId, targetId];
            } else {
                let foundTwoHop = false;
                const intermediateNodeCandidates = activeNodes.filter(node => node.id !== sourceId && node.id !== targetId);
                for (const intermediateNode of intermediateNodeCandidates) {
                    // if (intermediateNode.data.isFailed) continue;
                    const edge1Exists = edges.some(edge =>
                        (edge.source === sourceId && edge.target === intermediateNode.id) ||
                        (edge.source === intermediateNode.id && e.target === sourceId)
                    );
                    const edge2Exists = edges.some(edge =>
                        (edge.source === intermediateNode.id && edge.target === targetId) ||
                        (e.source === targetId && e.target === intermediateNode.id)
                    );
                    if (edge1Exists && edge2Exists) {
                        currentMockPath = [sourceId, intermediateNode.id, targetId];
                        foundTwoHop = true;
                        break;
                    }
                }
                if (!foundTwoHop && sourceId !== targetId) {
                    currentMockPath = findPathBFS(sourceId, targetId, activeNodes, edges);
                }
            }
        }
         // If still no path found (e.g. disconnected graph), default to just source and target
        if (currentMockPath.length === 0 && sourceId !== targetId) {
            currentMockPath = []; // Indicate no path visually if BFS also fails
        } else if (currentMockPath.length === 0 && sourceId === targetId) {
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
                    const edge = edges.find(e => (e.source === curr && e.target === nextNode) || (e.source === nextNode && e.target === curr));
                    return acc + (edge?.data?.latency || 30); 
                }, 0)
                : (sourceId === targetId ? 0 : (edges.find(e => (e.source === sourceId && e.target === targetId) || (e.source === targetId && e.target === sourceId))?.data?.latency || 30));
             
             const avgPathLatency = pathLatencySum / Math.max(1, currentMockPath.length - 1);
             latencyFactor = Math.max(0.1, avgPathLatency / 20); 
             energyFactor = 1.0 - (weights.beta * 0.2) + (weights.gamma * 0.1); 
             deliveryFactor = Math.min(1.0, 0.9 + (weights.alpha * 0.05) - (weights.gamma * 0.1)); 
             lifetimeFactor = 0.85 + (weights.beta * 0.25);
        }
        
        const pathLength = currentMockPath.length > 0 ? Math.max(0, currentMockPath.length -1) : 0;
        const baseEnergyPerHop = 10;
        const baseLatencyPerHop = 15;

        return {
            algorithm: algo,
            path: currentMockPath,
            metrics: {
                energyConsumption: pathLength === 0 ? 0 : Math.max(5, (baseEnergyPerHop * pathLength + Math.random() * 20) * energyFactor),
                averageLatency: pathLength === 0 ? 0 : Math.max(5, (baseLatencyPerHop * pathLength + Math.random() * 10) * latencyFactor),
                deliveryRatio: currentMockPath.length === 0 ? 0 : (pathLength === 0 ? 1 : Math.min(1, Math.max(0, (0.85 + Math.random() * 0.15) * deliveryFactor))),
                networkLifetime: currentMockPath.length === 0 ? 0 : (pathLength === 0 ? 500 : Math.max(10, Math.floor((300 + Math.random() * 100) * lifetimeFactor / Math.max(1,pathLength)))),
            },
        };
    });

    setSimulationResults(results);

    const chosenAlgorithmForDisplay = simulationParams.algorithm === 'compare' ? 'adaptive' : simulationParams.algorithm;
    const resultForDisplay = results.find(r => r.algorithm === chosenAlgorithmForDisplay) || results[0];
    const pathEdgesToHighlight = new Set<string>();

     if (resultForDisplay && resultForDisplay.path.length > 1) {
        for (let i = 0; i < resultForDisplay.path.length - 1; i++) {
            const pathSource = resultForDisplay.path[i];
            const pathTarget = resultForDisplay.path[i+1];
            const edge = edges.find(e => (e.source === pathSource && e.target === pathTarget) || (e.source === pathTarget && e.target === pathSource));
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
        ? `Results generated for ${simulationParams.algorithm === 'compare' ? 'all algorithms' : simulationParams.algorithm}. Displaying path for ${chosenAlgorithmForDisplay}.`
        : `No path found for ${chosenAlgorithmForDisplay} from ${sourceNodeDetails?.data.label || sourceId} to ${targetNodeDetails?.data.label || targetId}.`,
       variant: pathFoundForDisplay ? 'default' : 'destructive'
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


    