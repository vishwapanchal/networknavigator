
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
        { id: 'n1', type: 'custom', position: { x: 50, y: 100 }, data: { id: 'n1', label: 'Sensor A', battery: 95, queueSize: 5, role: 'sensor', isFailed: false } },
        { id: 'n2', type: 'custom', position: { x: 250, y: 50 }, data: { id: 'n2', label: 'Router 1', battery: 100, queueSize: 10, role: 'router', isFailed: false } },
        { id: 'n3', type: 'custom', position: { x: 250, y: 150 }, data: { id: 'n3', label: 'Sensor B', battery: 90, queueSize: 3, role: 'sensor', isFailed: false } },
        { id: 'n4', type: 'custom', position: { x: 450, y: 100 }, data: { id: 'n4', label: 'Gateway', battery: 100, queueSize: 20, role: 'gateway', isFailed: false } },
      ],
      edges: [
        { id: 'e1-2', source: 'n1', target: 'n2', type: 'default', markerEnd: { type: MarkerType.ArrowClosed }, data: { latency: 10, bandwidth: 100 } },
        { id: 'e3-2', source: 'n3', target: 'n2', type: 'default', markerEnd: { type: MarkerType.ArrowClosed }, data: { latency: 12, bandwidth: 90 } },
        { id: 'e2-4', source: 'n2', target: 'n4', type: 'default', markerEnd: { type: MarkerType.ArrowClosed }, data: { latency: 8, bandwidth: 150 } },
         { id: 'e1-3', source: 'n1', target: 'n3', type: 'default', markerEnd: { type: MarkerType.ArrowClosed }, data: { latency: 20, bandwidth: 50 } },
      ],
    },
  },
  {
    id: 'low-battery',
    name: '2. Low Battery Node',
    description: 'Router 1 has low battery, potentially changing the optimal path.',
    data: {
       nodes: [
        { id: 'n1', type: 'custom', position: { x: 50, y: 100 }, data: { id: 'n1', label: 'Sensor A', battery: 95, queueSize: 5, role: 'sensor', isFailed: false } },
        { id: 'n2', type: 'custom', position: { x: 250, y: 50 }, data: { id: 'n2', label: 'Router 1 (Low Bat)', battery: 15, queueSize: 10, role: 'router', isFailed: false } },
        { id: 'n3', type: 'custom', position: { x: 250, y: 150 }, data: { id: 'n3', label: 'Router 2', battery: 90, queueSize: 8, role: 'router', isFailed: false } },
        { id: 'n4', type: 'custom', position: { x: 450, y: 100 }, data: { id: 'n4', label: 'Gateway', battery: 100, queueSize: 20, role: 'gateway', isFailed: false } },
      ],
      edges: [
         { id: 'e1-2', source: 'n1', target: 'n2', type: 'default', markerEnd: { type: MarkerType.ArrowClosed }, data: { latency: 10, bandwidth: 100 } },
         { id: 'e1-3', source: 'n1', target: 'n3', type: 'default', markerEnd: { type: MarkerType.ArrowClosed }, data: { latency: 15, bandwidth: 80 } },
         { id: 'e2-4', source: 'n2', target: 'n4', type: 'default', markerEnd: { type: MarkerType.ArrowClosed }, data: { latency: 8, bandwidth: 150 } },
         { id: 'e3-4', source: 'n3', target: 'n4', type: 'default', markerEnd: { type: MarkerType.ArrowClosed }, data: { latency: 12, bandwidth: 120 } },
      ],
    },
  },
   {
    id: 'queue-congestion',
    name: '3. Queue Congestion',
    description: 'Router 1 experiences high queue congestion.',
     data: {
       nodes: [
        { id: 'n1', type: 'custom', position: { x: 50, y: 100 }, data: { id: 'n1', label: 'Sensor A', battery: 95, queueSize: 5, role: 'sensor', isFailed: false } },
        { id: 'n2', type: 'custom', position: { x: 250, y: 50 }, data: { id: 'n2', label: 'Router 1 (Congested)', battery: 80, queueSize: 85, role: 'router', isFailed: false } },
        { id: 'n3', type: 'custom', position: { x: 250, y: 150 }, data: { id: 'n3', label: 'Router 2', battery: 90, queueSize: 15, role: 'router', isFailed: false } },
        { id: 'n4', type: 'custom', position: { x: 450, y: 100 }, data: { id: 'n4', label: 'Gateway', battery: 100, queueSize: 20, role: 'gateway', isFailed: false } },
      ],
      edges: [
         { id: 'e1-2', source: 'n1', target: 'n2', type: 'default', markerEnd: { type: MarkerType.ArrowClosed }, data: { latency: 10, bandwidth: 100 } },
         { id: 'e1-3', source: 'n1', target: 'n3', type: 'default', markerEnd: { type: MarkerType.ArrowClosed }, data: { latency: 15, bandwidth: 80 } },
         { id: 'e2-4', source: 'n2', target: 'n4', type: 'default', markerEnd: { type: MarkerType.ArrowClosed }, data: { latency: 8, bandwidth: 150 } },
         { id: 'e3-4', source: 'n3', target: 'n4', type: 'default', markerEnd: { type: MarkerType.ArrowClosed }, data: { latency: 12, bandwidth: 120 } },
         { id: 'e2-3', source: 'n2', target: 'n3', type: 'default', markerEnd: { type: MarkerType.ArrowClosed }, data: { latency: 5, bandwidth: 200 } },
      ],
    },
  },
   {
    id: 'dynamic-link',
    name: '4. Dynamic Link Quality',
    description: 'One link has poor latency/bandwidth.',
    data: {
       nodes: [
        { id: 'n1', type: 'custom', position: { x: 50, y: 100 }, data: { id: 'n1', label: 'Sensor A', battery: 95, queueSize: 5, role: 'sensor', isFailed: false } },
        { id: 'n2', type: 'custom', position: { x: 250, y: 50 }, data: { id: 'n2', label: 'Router 1', battery: 80, queueSize: 10, role: 'router', isFailed: false } },
        { id: 'n3', type: 'custom', position: { x: 250, y: 150 }, data: { id: 'n3', label: 'Router 2', battery: 90, queueSize: 8, role: 'router', isFailed: false } },
        { id: 'n4', type: 'custom', position: { x: 450, y: 100 }, data: { id: 'n4', label: 'Gateway', battery: 100, queueSize: 20, role: 'gateway', isFailed: false } },
      ],
      edges: [
         { id: 'e1-2', source: 'n1', target: 'n2', type: 'default', markerEnd: { type: MarkerType.ArrowClosed }, data: { latency: 50, bandwidth: 20 } },
         { id: 'e1-3', source: 'n1', target: 'n3', type: 'default', markerEnd: { type: MarkerType.ArrowClosed }, data: { latency: 15, bandwidth: 80 } },
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
        { id: 'n1', type: 'custom', position: { x: 50, y: 50 }, data: { id: 'n1', label: 'Sensor A', battery: 90, queueSize: 2, role: 'sensor', isFailed: false } },
        { id: 'n2', type: 'custom', position: { x: 50, y: 150 }, data: { id: 'n2', label: 'Sensor B', battery: 85, queueSize: 4, role: 'sensor', isFailed: false } },
        { id: 'n3', type: 'custom', position: { x: 200, y: 100 }, data: { id: 'n3', label: 'Router 1', battery: 95, queueSize: 15, role: 'router', isFailed: false } },
        { id: 'n4', type: 'custom', position: { x: 350, y: 50 }, data: { id: 'n4', label: 'Router 2', battery: 98, queueSize: 10, role: 'router', isFailed: false } },
        { id: 'n5', type: 'custom', position: { x: 350, y: 150 }, data: { id: 'n5', label: 'Sensor C', battery: 92, queueSize: 3, role: 'sensor', isFailed: false } },
        { id: 'n6', type: 'custom', position: { x: 500, y: 100 }, data: { id: 'n6', label: 'Gateway', battery: 100, queueSize: 25, role: 'gateway', isFailed: false } },
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
   {
    id: 'hospital-iot-network',
    name: '6. Hospital IoT Network',
    description: 'A large, complex IoT network simulating a hospital environment. Demonstrates adaptive routing with diverse sensor needs (e.g., low-latency ICU data vs. low-power asset tags), node failure impact on critical paths, bottleneck identification at core routers/gateways, and benefits of redundancy. Adjust adaptive weights to prioritize different operational needs.',
    data: {
      nodes: [
        // Wing A Sensors
        { id: 'patMonA1', type: 'custom', position: { x: 50, y: 50 }, data: { id: 'patMonA1', label: 'Patient Mon A1', battery: 95, queueSize: 5, role: 'sensor', isFailed: false } },
        { id: 'patMonA2', type: 'custom', position: { x: 50, y: 150 }, data: { id: 'patMonA2', label: 'Patient Mon A2', battery: 92, queueSize: 7, role: 'sensor', isFailed: false } },
        { id: 'bedOccA1', type: 'custom', position: { x: 150, y: 50 }, data: { id: 'bedOccA1', label: 'Bed Occ A1', battery: 80, queueSize: 2, role: 'sensor', isFailed: false } },
        { id: 'bedOccA2', type: 'custom', position: { x: 150, y: 150 }, data: { id: 'bedOccA2', label: 'Bed Occ A2', battery: 78, queueSize: 3, role: 'sensor', isFailed: false } },
        { id: 'roomEnvA1', type: 'custom', position: { x: 100, y: 100 }, data: { id: 'roomEnvA1', label: 'Room Env A1', battery: 99, queueSize: 1, role: 'sensor', isFailed: false } },
        { id: 'staffBadgeA1', type: 'custom', position: { x: 80, y: 200 }, data: { id: 'staffBadgeA1', label: 'Staff Badge A1', battery: 65, queueSize: 0, role: 'sensor', isFailed: false } },
        // Wing B (ICU) Sensors
        { id: 'icuMonB1', type: 'custom', position: { x: 50, y: 350 }, data: { id: 'icuMonB1', label: 'ICU Mon B1', battery: 98, queueSize: 8, role: 'sensor', isFailed: false } },
        { id: 'icuMonB2', type: 'custom', position: { x: 50, y: 450 }, data: { id: 'icuMonB2', label: 'ICU Mon B2', battery: 97, queueSize: 9, role: 'sensor', isFailed: false } },
        { id: 'medEqB1', type: 'custom', position: { x: 150, y: 350 }, data: { id: 'medEqB1', label: 'Ventilator B1', battery: 70, queueSize: 15, role: 'sensor', isFailed: false } },
        { id: 'assetTagB1', type: 'custom', position: { x: 150, y: 450 }, data: { id: 'assetTagB1', label: 'X-Ray Tag B1', battery: 35, queueSize: 0, role: 'sensor', isFailed: false } },
        // Wing C Sensors
        { id: 'patMonC1', type: 'custom', position: { x: 500, y: 50 }, data: { id: 'patMonC1', label: 'Patient Mon C1', battery: 93, queueSize: 6, role: 'sensor', isFailed: false } },
        { id: 'bedOccC1', type: 'custom', position: { x: 600, y: 100 }, data: { id: 'bedOccC1', label: 'Bed Occ C1', battery: 82, queueSize: 2, role: 'sensor', isFailed: false } },
        { id: 'staffBadgeC1', type: 'custom', position: { x: 550, y: 200 }, data: { id: 'staffBadgeC1', label: 'Staff Badge C1', battery: 60, queueSize: 0, role: 'sensor', isFailed: false } },
        // Routers
        { id: 'floorRouterA', type: 'custom', position: { x: 100, y: 250 }, data: { id: 'floorRouterA', label: 'Floor Rtr A', battery: 100, queueSize: 20, role: 'router', isFailed: false } },
        { id: 'floorRouterB', type: 'custom', position: { x: 100, y: 500 }, data: { id: 'floorRouterB', label: 'ICU Rtr B', battery: 100, queueSize: 30, role: 'router', isFailed: false } },
        { id: 'floorRouterC', type: 'custom', position: { x: 550, y: 250 }, data: { id: 'floorRouterC', label: 'Floor Rtr C', battery: 100, queueSize: 18, role: 'router', isFailed: false } },
        { id: 'coreRouter1', type: 'custom', position: { x: 300, y: 150 }, data: { id: 'coreRouter1', label: 'Core Rtr 1', battery: 100, queueSize: 40, role: 'router', isFailed: false } },
        { id: 'coreRouter2', type: 'custom', position: { x: 300, y: 350 }, data: { id: 'coreRouter2', label: 'Core Rtr 2', battery: 100, queueSize: 35, role: 'router', isFailed: false } },
        { id: 'backupRouter', type: 'custom', position: { x: 400, y: 250 }, data: { id: 'backupRouter', label: 'Backup Rtr', battery: 100, queueSize: 10, role: 'router', isFailed: false } },
        // Gateways
        { id: 'mainGateway', type: 'custom', position: { x: 700, y: 150 }, data: { id: 'mainGateway', label: 'Main Gateway', battery: 100, queueSize: 50, role: 'gateway', isFailed: false } },
        { id: 'erGateway', type: 'custom', position: { x: 700, y: 350 }, data: { id: 'erGateway', label: 'ER Gateway', battery: 100, queueSize: 25, role: 'gateway', isFailed: false } },
      ],
      edges: [
        // Wing A to Floor Router A
        { id: 'e-pMA1-fRA', source: 'patMonA1', target: 'floorRouterA', data: { latency: 10, bandwidth: 100 } },
        { id: 'e-pMA2-fRA', source: 'patMonA2', target: 'floorRouterA', data: { latency: 12, bandwidth: 100 } },
        { id: 'e-bOA1-fRA', source: 'bedOccA1', target: 'floorRouterA', data: { latency: 8, bandwidth: 80 } },
        { id: 'e-bOA2-fRA', source: 'bedOccA2', target: 'floorRouterA', data: { latency: 9, bandwidth: 80 } },
        { id: 'e-rEA1-fRA', source: 'roomEnvA1', target: 'floorRouterA', data: { latency: 15, bandwidth: 50 } },
        { id: 'e-sBA1-fRA', source: 'staffBadgeA1', target: 'floorRouterA', data: { latency: 5, bandwidth: 60 } },
        // Wing B to Floor Router B
        { id: 'e-iMB1-fRB', source: 'icuMonB1', target: 'floorRouterB', data: { latency: 5, bandwidth: 150 } },
        { id: 'e-iMB2-fRB', source: 'icuMonB2', target: 'floorRouterB', data: { latency: 6, bandwidth: 150 } },
        { id: 'e-mEB1-fRB', source: 'medEqB1', target: 'floorRouterB', data: { latency: 7, bandwidth: 120 } },
        { id: 'e-aTB1-fRB', source: 'assetTagB1', target: 'floorRouterB', data: { latency: 20, bandwidth: 40 } },
        // Wing C to Floor Router C
        { id: 'e-pMC1-fRC', source: 'patMonC1', target: 'floorRouterC', data: { latency: 11, bandwidth: 100 } },
        { id: 'e-bOC1-fRC', source: 'bedOccC1', target: 'floorRouterC', data: { latency: 10, bandwidth: 80 } },
        { id: 'e-sBC1-fRC', source: 'staffBadgeC1', target: 'floorRouterC', data: { latency: 6, bandwidth: 60 } },
        // Floor Routers to Core Routers & Backup
        { id: 'e-fRA-cR1', source: 'floorRouterA', target: 'coreRouter1', data: { latency: 5, bandwidth: 300 } },
        { id: 'e-fRA-cR2', source: 'floorRouterA', target: 'coreRouter2', data: { latency: 6, bandwidth: 280 } },
        { id: 'e-fRA-bkR', source: 'floorRouterA', target: 'backupRouter', data: { latency: 8, bandwidth: 250 } },
        { id: 'e-fRB-cR1', source: 'floorRouterB', target: 'coreRouter1', data: { latency: 4, bandwidth: 350 } },
        { id: 'e-fRB-cR2', source: 'floorRouterB', target: 'coreRouter2', data: { latency: 5, bandwidth: 320 } },
        { id: 'e-fRB-bkR', source: 'floorRouterB', target: 'backupRouter', data: { latency: 7, bandwidth: 280 } },
        { id: 'e-fRC-cR1', source: 'floorRouterC', target: 'coreRouter1', data: { latency: 6, bandwidth: 290 } },
        { id: 'e-fRC-bkR', source: 'floorRouterC', target: 'backupRouter', data: { latency: 7, bandwidth: 260 } },
        // Inter-Core and Backup Router connections
        { id: 'e-cR1-cR2', source: 'coreRouter1', target: 'coreRouter2', data: { latency: 2, bandwidth: 1000 } },
        { id: 'e-cR1-bkR', source: 'coreRouter1', target: 'backupRouter', data: { latency: 3, bandwidth: 700 } },
        { id: 'e-cR2-bkR', source: 'coreRouter2', target: 'backupRouter', data: { latency: 3, bandwidth: 650 } },
        // Core Routers & Backup to Gateways
        { id: 'e-cR1-mG', source: 'coreRouter1', target: 'mainGateway', data: { latency: 2, bandwidth: 800 } },
        { id: 'e-cR1-eG', source: 'coreRouter1', target: 'erGateway', data: { latency: 3, bandwidth: 400 } },
        { id: 'e-cR2-mG', source: 'coreRouter2', target: 'mainGateway', data: { latency: 3, bandwidth: 750 } },
        { id: 'e-cR2-eG', source: 'coreRouter2', target: 'erGateway', data: { latency: 2, bandwidth: 450 } },
        { id: 'e-bkR-mG', source: 'backupRouter', target: 'mainGateway', data: { latency: 4, bandwidth: 500 } },
        { id: 'e-bkR-eG', source: 'backupRouter', target: 'erGateway', data: { latency: 5, bandwidth: 300 } },
      ].map(e => ({ ...e, type: 'default', markerEnd: { type: MarkerType.ArrowClosed } })), // Ensure all edges have default type and marker
    },
  },
];

    