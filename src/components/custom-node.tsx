'use client';

import React, { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { Card, CardContent } from '@/components/ui/card';
import { BatteryMedium, Layers2, Router, Network, Server } from 'lucide-react'; // Using Router for Router/Gateway, Network for Sensor
import type { NodeData } from '@/context/network-context';

const CustomNode = memo(({ data, isConnectable, selected }: NodeProps<NodeData>) => {
  const { label, battery, queueSize, role } = data;

  const getIcon = () => {
    switch (role) {
      case 'sensor':
        return <Network size={16} className="text-muted-foreground" />;
      case 'router':
        return <Router size={16} className="text-muted-foreground" />;
      case 'gateway':
        return <Server size={16} className="text-muted-foreground" />;
      default:
        return <Network size={16} className="text-muted-foreground" />;
    }
  };

  // Determine battery color based on level
   const getBatteryColor = (level: number) => {
    if (level < 20) return 'text-destructive';
    if (level < 50) return 'text-yellow-500'; // Note: direct color use, might need theme adjustment
    return 'text-green-500'; // Note: direct color use
   }

  return (
    <Card className={`w-36 shadow-md rounded-lg border ${selected ? 'border-accent border-2' : 'border-primary'} bg-card text-card-foreground transition-all duration-150 ease-in-out`}>
      <CardContent className="p-2 text-center">
         <div className="flex items-center justify-center mb-1 gap-1">
            {getIcon()}
            <div className="text-xs font-semibold truncate" title={label}>{label}</div>
         </div>
        <div className="flex justify-around items-center text-xs mt-1 text-muted-foreground">
          <div className={`flex items-center gap-0.5 ${getBatteryColor(battery)}`} title={`Battery: ${battery}%`}>
            <BatteryMedium size={12} />
            <span>{battery}%</span>
          </div>
          <div className="flex items-center gap-0.5" title={`Queue: ${queueSize}`}>
            <Layers2 size={12} />
            <span>{queueSize}</span>
          </div>
        </div>
      </CardContent>
       {/* Add Handles - adjust positions as needed */}
      <Handle type="target" position={Position.Top} isConnectable={isConnectable} className="w-2 h-2 !bg-primary" />
      <Handle type="source" position={Position.Bottom} isConnectable={isConnectable} className="w-2 h-2 !bg-primary"/>
      <Handle type="target" position={Position.Left} isConnectable={isConnectable} className="w-2 h-2 !bg-primary" />
      <Handle type="source" position={Position.Right} isConnectable={isConnectable} className="w-2 h-2 !bg-primary"/>
    </Card>
  );
});

CustomNode.displayName = 'CustomNode';

export default CustomNode;
