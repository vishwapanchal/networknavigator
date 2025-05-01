import type { Node, Edge } from 'reactflow';
import type { NodeData, EdgeData } from '@/context/network-context';
import { MarkerType } from 'reactflow';

interface ExampleScenario {
  id: string;
  name: string;
  description: string;
  data: {
    nodes: Node<NodeData>[];
    edges: Edge<EdgeData>[];
  };
}

export const exampleScenarios: ExampleScenario[] = [
  {
    id: 'stable-network',
    name: '1. Stable Network',
    description: 'A basic network with stable parameters.',
    data: {
      nodes: [
        { id: 'n1', type: 'custom', position: { x: 50, y: 100 }, data: { id: 'n1', label: 'Sensor A', battery: 95, queueSize: 5, role: 'sensor' } },
        { id: 'n2', type: 'custom', position: { x: 250, y: 50 }, data: { id: 'n2', label: 'Router 1', battery: 100, queueSize: 10, role: 'router' } },
        { id: 'n3', type: 'custom', position: { x: 250, y: 150 }, data: { id: 'n3', label: 'Sensor B', battery: 90, queueSize: 3, role: 'sensor' } },
        { id: 'n4', type: 'custom', position: { x: 450, y: 100 }, data: { id: 'n4', label: 'Gateway', battery: 100, queueSize: 20, role: 'gateway' } },
      ],
      edges: [
        { id: 'e1-2', source: 'n1', target: 'n2', type: 'default', markerEnd: { type: MarkerType.ArrowClosed }, data: { latency: 10, bandwidth: 100 } },
        { id: 'e3-2', source: 'n3', target: 'n2', type: 'default', markerEnd: { type: MarkerType.ArrowClosed }, data: { latency: 12, bandwidth: 90 } },
        { id: 'e2-4', source: 'n2', target: 'n4', type: 'default', markerEnd: { type: MarkerType.ArrowClosed }, data: { latency: 8, bandwidth: 150 } },
         { id: 'e1-3', source: 'n1', target: 'n3', type: 'default', markerEnd: { type: MarkerType.ArrowClosed }, data: { latency: 20, bandwidth: 50 } }, // Less optimal path
      ],
    },
  },
  {
    id: 'low-battery',
    name: '2. Low Battery Node',
    description: 'Router 1 has low battery, potentially changing the optimal path.',
    data: {
       nodes: [
        { id: 'n1', type: 'custom', position: { x: 50, y: 100 }, data: { id: 'n1', label: 'Sensor A', battery: 95, queueSize: 5, role: 'sensor' } },
        { id: 'n2', type: 'custom', position: { x: 250, y: 50 }, data: { id: 'n2', label: 'Router 1 (Low Bat)', battery: 15, queueSize: 10, role: 'router' } }, // Low Battery
        { id: 'n3', type: 'custom', position: { x: 250, y: 150 }, data: { id: 'n3', label: 'Router 2', battery: 90, queueSize: 8, role: 'router' } },
        { id: 'n4', type: 'custom', position: { x: 450, y: 100 }, data: { id: 'n4', label: 'Gateway', battery: 100, queueSize: 20, role: 'gateway' } },
      ],
      edges: [
         { id: 'e1-2', source: 'n1', target: 'n2', type: 'default', markerEnd: { type: MarkerType.ArrowClosed }, data: { latency: 10, bandwidth: 100 } },
         { id: 'e1-3', source: 'n1', target: 'n3', type: 'default', markerEnd: { type: MarkerType.ArrowClosed }, data: { latency: 15, bandwidth: 80 } }, // Alternative path
         { id: 'e2-4', source: 'n2', target: 'n4', type: 'default', markerEnd: { type: MarkerType.ArrowClosed }, data: { latency: 8, bandwidth: 150 } }, // Path via low battery node
         { id: 'e3-4', source: 'n3', target: 'n4', type: 'default', markerEnd: { type: MarkerType.ArrowClosed }, data: { latency: 12, bandwidth: 120 } }, // Alternative path to gateway
      ],
    },
  },
   {
    id: 'queue-congestion',
    name: '3. Queue Congestion',
    description: 'Router 1 experiences high queue congestion.',
     data: {
       nodes: [
        { id: 'n1', type: 'custom', position: { x: 50, y: 100 }, data: { id: 'n1', label: 'Sensor A', battery: 95, queueSize: 5, role: 'sensor' } },
        { id: 'n2', type: 'custom', position: { x: 250, y: 50 }, data: { id: 'n2', label: 'Router 1 (Congested)', battery: 80, queueSize: 85, role: 'router' } }, // High Queue
        { id: 'n3', type: 'custom', position: { x: 250, y: 150 }, data: { id: 'n3', label: 'Router 2', battery: 90, queueSize: 15, role: 'router' } },
        { id: 'n4', type: 'custom', position: { x: 450, y: 100 }, data: { id: 'n4', label: 'Gateway', battery: 100, queueSize: 20, role: 'gateway' } },
      ],
      edges: [
         { id: 'e1-2', source: 'n1', target: 'n2', type: 'default', markerEnd: { type: MarkerType.ArrowClosed }, data: { latency: 10, bandwidth: 100 } },
         { id: 'e1-3', source: 'n1', target: 'n3', type: 'default', markerEnd: { type: MarkerType.ArrowClosed }, data: { latency: 15, bandwidth: 80 } },
         { id: 'e2-4', source: 'n2', target: 'n4', type: 'default', markerEnd: { type: MarkerType.ArrowClosed }, data: { latency: 8, bandwidth: 150 } },
         { id: 'e3-4', source: 'n3', target: 'n4', type: 'default', markerEnd: { type: MarkerType.ArrowClosed }, data: { latency: 12, bandwidth: 120 } },
         { id: 'e2-3', source: 'n2', target: 'n3', type: 'default', markerEnd: { type: MarkerType.ArrowClosed }, data: { latency: 5, bandwidth: 200 } }, // Link between routers
      ],
    },
  },
   {
    id: 'dynamic-link',
    name: '4. Dynamic Link Quality',
    description: 'One link has poor latency/bandwidth.',
    data: {
       nodes: [
        { id: 'n1', type: 'custom', position: { x: 50, y: 100 }, data: { id: 'n1', label: 'Sensor A', battery: 95, queueSize: 5, role: 'sensor' } },
        { id: 'n2', type: 'custom', position: { x: 250, y: 50 }, data: { id: 'n2', label: 'Router 1', battery: 80, queueSize: 10, role: 'router' } },
        { id: 'n3', type: 'custom', position: { x: 250, y: 150 }, data: { id: 'n3', label: 'Router 2', battery: 90, queueSize: 8, role: 'router' } },
        { id: 'n4', type: 'custom', position: { x: 450, y: 100 }, data: { id: 'n4', label: 'Gateway', battery: 100, queueSize: 20, role: 'gateway' } },
      ],
      edges: [
         { id: 'e1-2', source: 'n1', target: 'n2', type: 'default', markerEnd: { type: MarkerType.ArrowClosed }, data: { latency: 50, bandwidth: 20 } }, // Poor link quality
         { id: 'e1-3', source: 'n1', target: 'n3', type: 'default', markerEnd: { type: MarkerType.ArrowClosed }, data: { latency: 15, bandwidth: 80 } }, // Better link
         { id: 'e2-4', source: 'n2', target: 'n4', type: 'default', markerEnd: { type: MarkerType.ArrowClosed }, data: { latency: 8, bandwidth: 150 } },
         { id: 'e3-4', source: 'n3', target: 'n4', type: 'default', markerEnd: { type: MarkerType.ArrowClosed }, data: { latency: 12, bandwidth: 120 } },
         { id: 'e2-3', source: 'n2', target: 'n3', type: 'default', markerEnd: { type: MarkerType.ArrowClosed }, data: { latency: 5, bandwidth: 200 } },
      ],
    },
  },
   {
    id: 'larger-network',
    name: '5. Larger Network',
    description: 'A slightly more complex network topology.',
     data: {
       nodes: [
        { id: 'n1', type: 'custom', position: { x: 50, y: 50 }, data: { id: 'n1', label: 'Sensor A', battery: 90, queueSize: 2, role: 'sensor' } },
        { id: 'n2', type: 'custom', position: { x: 50, y: 150 }, data: { id: 'n2', label: 'Sensor B', battery: 85, queueSize: 4, role: 'sensor' } },
        { id: 'n3', type: 'custom', position: { x: 200, y: 100 }, data: { id: 'n3', label: 'Router 1', battery: 95, queueSize: 15, role: 'router' } },
        { id: 'n4', type: 'custom', position: { x: 350, y: 50 }, data: { id: 'n4', label: 'Router 2', battery: 98, queueSize: 10, role: 'router' } },
        { id: 'n5', type: 'custom', position: { x: 350, y: 150 }, data: { id: 'n5', label: 'Sensor C', battery: 92, queueSize: 3, role: 'sensor' } },
        { id: 'n6', type: 'custom', position: { x: 500, y: 100 }, data: { id: 'n6', label: 'Gateway', battery: 100, queueSize: 25, role: 'gateway' } },
       ],
       edges: [
         { id: 'e1-3', source: 'n1', target: 'n3', type: 'default', markerEnd: { type: MarkerType.ArrowClosed }, data: { latency: 10, bandwidth: 100 } },
         { id: 'e2-3', source: 'n2', target: 'n3', type: 'default', markerEnd: { type: MarkerType.ArrowClosed }, data: { latency: 12, bandwidth: 90 } },
         { id: 'e3-4', source: 'n3', target: 'n4', type: 'default', markerEnd: { type: MarkerType.ArrowClosed }, data: { latency: 8, bandwidth: 150 } },
         { id: 'e3-5', source: 'n3', target: 'n5', type: 'default', markerEnd: { type: MarkerType.ArrowClosed }, data: { latency: 18, bandwidth: 70 } },
         { id: 'e4-6', source: 'n4', target: 'n6', type: 'default', markerEnd: { type: MarkerType.ArrowClosed }, data: { latency: 6, bandwidth: 180 } },
         { id: 'e5-4', source: 'n5', target: 'n4', type: 'default', markerEnd: { type: MarkerType.ArrowClosed }, data: { latency: 9, bandwidth: 110 } },
         { id: 'e5-6', source: 'n5', target: 'n6', type: 'default', markerEnd: { type: MarkerType.ArrowClosed }, data: { latency: 14, bandwidth: 95 } },
       ],
     },
   },
];
