'use client';

import React, { useState, useEffect } from 'react';
import { useNetwork } from '@/context/network-context';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Button } from './ui/button';
import { Save, Trash2, Type, BatteryCharging, ArrowRightLeft, Layers3, Zap, Clock } from 'lucide-react';
import { ScrollArea } from './ui/scroll-area';
import { Separator } from './ui/separator';
import type { Node, Edge } from 'reactflow';

interface SidebarProps {}

export function Sidebar({}: SidebarProps) {
  const {
    selectedElement,
    updateNodeData,
    updateEdgeData,
    simulationParams,
    setSimulationParams,
    deleteSelectedElement,
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
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="role">Role</Label>
                      <Select
                        value={localData?.role || 'sensor'}
                        onValueChange={(value) => handleSelectChange('role', value)}
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
                 <Button onClick={handleSave} size="sm">
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
                   {useNetwork().nodes.map((node) => (
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
                    {useNetwork().nodes.map((node) => (
                     <SelectItem key={node.id} value={node.id}>{node.data.label || node.id}</SelectItem>
                   ))}
                 </SelectContent>
               </Select>
             </div>

            {simulationParams.algorithm === 'adaptive' || simulationParams.algorithm === 'compare' ? (
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
                 {totalWeight.toFixed(2) !== '1.00' && (
                    <p className="text-xs text-destructive font-medium">Warning: Weights do not sum to 1.</p>
                 )}
              </div>
            ): null}
          </div>
        </CardContent>
      </ScrollArea>
    </Card>
  );
}
