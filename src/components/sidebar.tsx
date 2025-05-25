
'use client';

import React, { useState, useEffect } from 'react';
import { useNetwork } from '@/context/network-context';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea'; 
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Button } from './ui/button';
import { Save, Trash2, Type, BatteryCharging, ArrowRightLeft, Layers3, Zap, Clock, LayoutGrid, ShieldAlert, ShieldCheck } from 'lucide-react'; // Added ShieldAlert, ShieldCheck
import { ScrollArea } from './ui/scroll-area';
import { Separator } from './ui/separator';
import type { Node, Edge } from 'reactflow';
import type { NodeData } from '@/context/network-context';


interface SidebarProps {}

export function Sidebar({}: SidebarProps) {
  const {
    selectedElement,
    updateNodeData,
    updateEdgeData,
    simulationParams,
    setSimulationParams,
    deleteSelectedElement,
    matrixSize,
    setMatrixSize,
    matrixInput,
    setMatrixInput,
    generateNetworkFromMatrix,
    toggleNodeFailState, // Added
    nodes: networkNodes, // Renamed to avoid conflict with reactflow Node type
  } = useNetwork();

  const [localData, setLocalData] = useState<any>({});

  useEffect(() => {
    if (selectedElement) {
      setLocalData(selectedElement.data);
    } else {
      setLocalData({});
    }
  }, [selectedElement]);

  const handleInputChange = (field: string, value: string | number) => {
    setLocalData((prev: any) => ({ ...prev, [field]: value }));
  };

  const handleSelectChange = (field: string, value: string) => {
    setLocalData((prev: any) => ({ ...prev, [field]: value }));
  };

  const handleSliderChange = (field: string, value: number[]) => {
     setSimulationParams((prev) => ({ ...prev, weights: { ...prev.weights, [field]: value[0] } }));
  };

   const handleParamChange = (field: string, value: string | number) => {
    setSimulationParams((prev) => ({ ...prev, [field]: value }));
  };


  const handleSave = () => {
    if (selectedElement) {
      if ('position' in selectedElement) { // It's a Node
        updateNodeData(selectedElement.id, localData);
      } else { // It's an Edge
        updateEdgeData(selectedElement.id, localData);
      }
    }
  };

  const isNode = selectedElement && 'position' in selectedElement;
  const isEdge = selectedElement && !isNode;
  const selectedNodeData = isNode ? (selectedElement as Node<NodeData>).data : null;


  const totalWeight = Object.values(simulationParams.weights).reduce((sum, w) => sum + w, 0);


  return (
    <Card className="w-80 h-full flex flex-col rounded-none border-none border-r">
      <CardHeader className="p-4">
        <CardTitle className="text-lg">Properties & Parameters</CardTitle>
      </CardHeader>
      <ScrollArea className="flex-grow">
        <CardContent className="p-4 space-y-6">
          {selectedElement ? (
            <>
              <div className="space-y-4">
                <h3 className="font-semibold text-md mb-2">
                  {isNode ? 'Node Properties' : 'Edge Properties'}
                </h3>
                <div className="space-y-2">
                  <Label htmlFor="id"><Type className="inline-block mr-2 h-4 w-4" /> ID</Label>
                  <Input id="id" value={selectedElement.id} disabled className="text-xs" />
                </div>
                {isNode && (
                   <>
                    <div className="space-y-2">
                      <Label htmlFor="label">Label</Label>
                      <Input
                        id="label"
                        value={localData?.label || ''}
                        onChange={(e) => handleInputChange('label', e.target.value)}
                        className="text-sm"
                        disabled={selectedNodeData?.isFailed}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="battery"><BatteryCharging className="inline-block mr-2 h-4 w-4" /> Battery (%)</Label>
                      <Input
                        id="battery"
                        type="number"
                        value={localData?.battery || 0}
                        onChange={(e) => handleInputChange('battery', parseInt(e.target.value, 10))}
                        min={0}
                        max={100}
                        className="text-sm"
                        disabled={selectedNodeData?.isFailed}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="queueSize"><Layers3 className="inline-block mr-2 h-4 w-4" /> Queue Size</Label>
                      <Input
                        id="queueSize"
                        type="number"
                        value={localData?.queueSize || 0}
                        onChange={(e) => handleInputChange('queueSize', parseInt(e.target.value, 10))}
                        min={0}
                         className="text-sm"
                         disabled={selectedNodeData?.isFailed}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="role">Role</Label>
                      <Select
                        value={localData?.role || 'sensor'}
                        onValueChange={(value) => handleSelectChange('role', value)}
                        disabled={selectedNodeData?.isFailed}
                      >
                        <SelectTrigger id="role" className="w-full text-sm">
                          <SelectValue placeholder="Select role" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="sensor">Sensor</SelectItem>
                          <SelectItem value="router">Router</SelectItem>
                          <SelectItem value="gateway">Gateway</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                        <Button
                            onClick={() => toggleNodeFailState(selectedElement.id)}
                            variant={selectedNodeData?.isFailed ? "secondary" : "destructive"}
                            size="sm"
                            className="w-full"
                        >
                            {selectedNodeData?.isFailed ? <ShieldCheck className="mr-2 h-4 w-4" /> : <ShieldAlert className="mr-2 h-4 w-4" />}
                            {selectedNodeData?.isFailed ? "Restore Node" : "Fail Node"}
                        </Button>
                    </div>
                  </>
                )}
                 {isEdge && (
                   <>
                     <div className="space-y-2">
                       <Label htmlFor="latency"><Clock className="inline-block mr-2 h-4 w-4" /> Latency (ms)</Label>
                       <Input
                         id="latency"
                         type="number"
                         value={localData?.latency || 0}
                         onChange={(e) => handleInputChange('latency', parseInt(e.target.value, 10))}
                         min={0}
                         className="text-sm"
                       />
                     </div>
                     <div className="space-y-2">
                       <Label htmlFor="bandwidth"><ArrowRightLeft className="inline-block mr-2 h-4 w-4" /> Bandwidth (kbps)</Label>
                       <Input
                         id="bandwidth"
                         type="number"
                         value={localData?.bandwidth || 0}
                         onChange={(e) => handleInputChange('bandwidth', parseInt(e.target.value, 10))}
                         min={0}
                         className="text-sm"
                       />
                     </div>
                   </>
                 )}
              </div>
              <div className="flex space-x-2 mt-4">
                 <Button onClick={handleSave} size="sm" disabled={isNode && selectedNodeData?.isFailed}>
                   <Save className="mr-2 h-4 w-4" /> Save Changes
                 </Button>
                 <Button variant="destructive" size="sm" onClick={deleteSelectedElement}>
                   <Trash2 className="mr-2 h-4 w-4" /> Delete
                 </Button>
              </div>
              <Separator className="my-6" />
            </>
          ) : (
             <p className="text-sm text-muted-foreground">Select a node or edge to edit its properties.</p>
          )}


          {/* Simulation Parameters */}
          <div className="space-y-4">
            <h3 className="font-semibold text-md mb-2">Simulation Parameters</h3>
             <div className="space-y-2">
              <Label htmlFor="algorithm">Routing Algorithm</Label>
              <Select
                value={simulationParams.algorithm}
                onValueChange={(value) => handleParamChange('algorithm', value)}
              >
                <SelectTrigger id="algorithm" className="w-full text-sm">
                  <SelectValue placeholder="Select algorithm" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="dijkstra">Dijkstra</SelectItem>
                  <SelectItem value="bellman-ford">Bellman-Ford</SelectItem>
                  <SelectItem value="adaptive">Adaptive</SelectItem>
                  <SelectItem value="compare">Compare All</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
               <Label htmlFor="sourceNode">Source Node</Label>
               <Select
                 value={simulationParams.sourceNode || ""}
                 onValueChange={(value) => handleParamChange('sourceNode', value)}
               >
                 <SelectTrigger id="sourceNode" className="w-full text-sm">
                   <SelectValue placeholder="Select source node" />
                 </SelectTrigger>
                 <SelectContent>
                   {networkNodes.filter(node => !node.data.isFailed).map((node) => (
                     <SelectItem key={node.id} value={node.id}>{node.data.label || node.id}</SelectItem>
                   ))}
                 </SelectContent>
               </Select>
             </div>
             <div className="space-y-2">
               <Label htmlFor="targetNode">Target Node</Label>
               <Select
                 value={simulationParams.targetNode || ""}
                 onValueChange={(value) => handleParamChange('targetNode', value)}
               >
                 <SelectTrigger id="targetNode" className="w-full text-sm">
                   <SelectValue placeholder="Select target node" />
                 </SelectTrigger>
                 <SelectContent>
                    {networkNodes.filter(node => !node.data.isFailed).map((node) => (
                     <SelectItem key={node.id} value={node.id}>{node.data.label || node.id}</SelectItem>
                   ))}
                 </SelectContent>
               </Select>
             </div>

            {(simulationParams.algorithm === 'adaptive' || simulationParams.algorithm === 'compare') && (
              <div className="space-y-4 border p-3 rounded-md bg-secondary/50">
                 <h4 className="font-medium text-sm">Adaptive Algorithm Weights (α, β, γ)</h4>
                 <p className="text-xs text-muted-foreground">Adjust the weights (sum must be 1). Current Sum: {totalWeight.toFixed(2)}</p>

                 <div className="space-y-3">
                    <Label htmlFor="alpha" className="flex justify-between items-center text-xs">
                       <span>α (Latency Weight)</span>
                       <span>{simulationParams.weights.alpha.toFixed(2)}</span>
                    </Label>
                    <Slider
                        id="alpha"
                        min={0} max={1} step={0.01}
                        value={[simulationParams.weights.alpha]}
                        onValueChange={(value) => handleSliderChange('alpha', value)}
                        className="[&>span]:h-1 [&_[role=slider]]:h-3 [&_[role=slider]]:w-3"
                    />
                 </div>
                 <div className="space-y-3">
                    <Label htmlFor="beta" className="flex justify-between items-center text-xs">
                        <span>β (Battery Weight)</span>
                       <span>{simulationParams.weights.beta.toFixed(2)}</span>
                    </Label>
                    <Slider
                        id="beta"
                        min={0} max={1} step={0.01}
                        value={[simulationParams.weights.beta]}
                        onValueChange={(value) => handleSliderChange('beta', value)}
                        className="[&>span]:h-1 [&_[role=slider]]:h-3 [&_[role=slider]]:w-3"
                    />
                 </div>
                 <div className="space-y-3">
                    <Label htmlFor="gamma" className="flex justify-between items-center text-xs">
                       <span>γ (Queue Size Weight)</span>
                       <span>{simulationParams.weights.gamma.toFixed(2)}</span>
                    </Label>
                    <Slider
                        id="gamma"
                        min={0} max={1} step={0.01}
                        value={[simulationParams.weights.gamma]}
                        onValueChange={(value) => handleSliderChange('gamma', value)}
                         className="[&>span]:h-1 [&_[role=slider]]:h-3 [&_[role=slider]]:w-3"
                    />
                 </div>
                 {Math.abs(totalWeight - 1) > 0.001 && (
                    <p className="text-xs text-destructive font-medium">Warning: Weights do not sum to 1.</p>
                 )}
              </div>
            )}
          </div>

          <Separator className="my-6" />
            <div className="space-y-4">
              <h3 className="font-semibold text-md mb-2">Create from Adjacency Matrix</h3>
              <div className="space-y-2">
                <Label htmlFor="matrixSizeInput">Number of Nodes</Label>
                <Input
                  id="matrixSizeInput"
                  type="number"
                  value={matrixSize}
                  onChange={(e) => setMatrixSize(Math.max(1, parseInt(e.target.value, 10) || 1))}
                  min={1}
                  className="text-sm"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="matrixValueInput">Adjacency Matrix (0 or 1, comma-separated)</Label>
                <Textarea
                  id="matrixValueInput"
                  placeholder={`Example for ${matrixSize} nodes (1 for edge, 0 for no edge):\n0,1,0\n0,0,1\n1,0,0`}
                  value={matrixInput}
                  onChange={(e) => setMatrixInput(e.target.value)}
                  className="text-sm min-h-[100px]"
                />
                 <p className="text-xs text-muted-foreground">
                  Each row represents a node. Values are comma-separated.
                </p>
              </div>
              <Button
                onClick={() => generateNetworkFromMatrix(matrixInput, matrixSize)}
                size="sm"
                className="w-full"
              >
                <LayoutGrid className="mr-2 h-4 w-4" />
                Generate Network from Matrix
              </Button>
            </div>

        </CardContent>
      </ScrollArea>
    </Card>
  );
}

    