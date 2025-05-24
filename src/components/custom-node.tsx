
'use client';

import React, { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { Card, CardContent } from '@/components/ui/card';
import { BatteryMedium, Layers2, Router, Network, Server } from 'lucide-react';
import type { NodeData } from '@/context/network-context';
import { cn } from '@/lib/utils';

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

  const getBatteryColorClass = (level: number) => {
    if (level < 20) return 'text-battery-low';
    if (level < 50) return 'text-battery-medium';
    return 'text-battery-high';
  };

  const getRoleIndicatorStyle = (nodeRole: NodeData['role']) => {
    switch (nodeRole) {
      case 'sensor':
        return 'bg-[hsl(var(--role-sensor-accent-hsl))]';
      case 'router':
        return 'bg-[hsl(var(--role-router-accent-hsl))]';
      case 'gateway':
        return 'bg-[hsl(var(--role-gateway-accent-hsl))]';
      default:
        return 'bg-muted'; // A fallback color
    }
  };

  return (
    <Card className={cn('w-36 transition-all duration-150 ease-in-out overflow-hidden')}>
      <div className={cn("h-1.5 w-full", getRoleIndicatorStyle(role))} /> {/* Role Indicator Bar */}
      <CardContent className="p-2 text-center">
         <div className="flex items-center justify-center mb-1 gap-1">
            {getIcon()}
            <div className="text-xs font-semibold truncate" title={label}>{label}</div>
         </div>
        <div className="flex justify-around items-center text-xs mt-1">
          <div className={`flex items-center gap-0.5 ${getBatteryColorClass(battery)}`} title={`Battery: ${battery}%`}>
            <BatteryMedium size={12} />
            <span>{battery}%</span>
          </div>
          <div className="flex items-center gap-0.5 text-muted-foreground" title={`Queue: ${queueSize}`}>
            <Layers2 size={12} />
            <span>{queueSize}</span>
          </div>
        </div>
      </CardContent>
      <Handle type="target" position={Position.Top} isConnectable={isConnectable} />
      <Handle type="source" position={Position.Bottom} isConnectable={isConnectable} />
      <Handle type="target" position={Position.Left} isConnectable={isConnectable} />
      <Handle type="source" position={Position.Right} isConnectable={isConnectable} />
    </Card>
  );
});

CustomNode.displayName = 'CustomNode';

export default CustomNode;
