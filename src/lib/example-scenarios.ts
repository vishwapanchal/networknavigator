
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
         { id: 'e1-2', source: 'n1', target: 'n2', type: 'default', markerEnd: { type: MarkerType.ArrowClosed }, data: { latency: 50, bandwidth: 20 } }, // Poor link
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
    description: 'A large, complex IoT network simulating a hospital environment. Nodes are arranged floor-wise and room-wise to show diverse sensor needs (e.g., low-latency ICU data vs. low-power asset tags), node failure impact on critical paths, bottleneck identification at core routers/gateways, and benefits of redundancy. Adjust adaptive weights to prioritize different operational needs.',
    data: {
      nodes: [
        // Wing A (General Ward - Top-Left Block)
        { id: 'sA1', type: 'custom', position: { x: 50, y: 50 }, data: { id: 'sA1', label: 'S-A1 (R101 Mon)', battery: 95, queueSize: 5, role: 'sensor', isFailed: false } },
        { id: 'sA2', type: 'custom', position: { x: 50, y: 120 }, data: { id: 'sA2', label: 'S-A2 (R101 Bed)', battery: 80, queueSize: 2, role: 'sensor', isFailed: false } },
        { id: 'sA3', type: 'custom', position: { x: 150, y: 50 }, data: { id: 'sA3', label: 'S-A3 (R102 Mon)', battery: 92, queueSize: 7, role: 'sensor', isFailed: false } },
        { id: 'sA4', type: 'custom', position: { x: 150, y: 120 }, data: { id: 'sA4', label: 'S-A4 (R102 Bed)', battery: 78, queueSize: 3, role: 'sensor', isFailed: false } },
        { id: 'sA5', type: 'custom', position: { x: 100, y: 190 }, data: { id: 'sA5', label: 'S-A5 (Env A)', battery: 99, queueSize: 1, role: 'sensor', isFailed: false } },
        { id: 'rA', type: 'custom', position: { x: 250, y: 100 }, data: { id: 'rA', label: 'Rtr-A (F1)', battery: 100, queueSize: 20, role: 'router', isFailed: false } },

        // Wing B (ICU - Bottom-Left Block)
        { id: 'sB1', type: 'custom', position: { x: 50, y: 350 }, data: { id: 'sB1', label: 'S-B1 (ICU1 Mon)', battery: 98, queueSize: 8, role: 'sensor', isFailed: false } },
        { id: 'sB2', type: 'custom', position: { x: 50, y: 420 }, data: { id: 'sB2', label: 'S-B2 (ICU1 Vent)', battery: 70, queueSize: 15, role: 'sensor', isFailed: false } },
        { id: 'sB3', type: 'custom', position: { x: 150, y: 350 }, data: { id: 'sB3', label: 'S-B3 (ICU2 Mon)', battery: 97, queueSize: 9, role: 'sensor', isFailed: false } },
        { id: 'sB4', type: 'custom', position: { x: 150, y: 420 }, data: { id: 'sB4', label: 'S-B4 (Asset Tag)', battery: 35, queueSize: 0, role: 'sensor', isFailed: false } },
        { id: 'rB', type: 'custom', position: { x: 250, y: 385 }, data: { id: 'rB', label: 'Rtr-B (ICU)', battery: 100, queueSize: 30, role: 'router', isFailed: false } },

        // Wing C (Outpatient/Other Ward - Top-Right Block)
        { id: 'sC1', type: 'custom', position: { x: 600, y: 50 }, data: { id: 'sC1', label: 'S-C1 (R201 Mon)', battery: 93, queueSize: 6, role: 'sensor', isFailed: false } },
        { id: 'sC2', type: 'custom', position: { x: 600, y: 120 }, data: { id: 'sC2', label: 'S-C2 (R201 Bed)', battery: 82, queueSize: 2, role: 'sensor', isFailed: false } },
        { id: 'sC3', type: 'custom', position: { x: 700, y: 85 }, data: { id: 'sC3', label: 'S-C3 (Staff C)', battery: 60, queueSize: 0, role: 'sensor', isFailed: false } },
        { id: 'rC', type: 'custom', position: { x: 500, y: 85 }, data: { id: 'rC', label: 'Rtr-C (F2)', battery: 100, queueSize: 18, role: 'router', isFailed: false } },
        
        // Core Infrastructure (Middle Area - Vertical)
        { id: 'cR1', type: 'custom', position: { x: 400, y: 150 }, data: { id: 'cR1', label: 'Core Rtr 1', battery: 100, queueSize: 40, role: 'router', isFailed: false } },
        { id: 'cR2', type: 'custom', position: { x: 400, y: 300 }, data: { id: 'cR2', label: 'Core Rtr 2', battery: 100, queueSize: 35, role: 'router', isFailed: false } },
        
        // Gateways (Far Right - Vertical)
        { id: 'gW1', type: 'custom', position: { x: 850, y: 150 }, data: { id: 'gW1', label: 'Main Gateway', battery: 100, queueSize: 50, role: 'gateway', isFailed: false } },
        { id: 'gW2', type: 'custom', position: { x: 850, y: 300 }, data: { id: 'gW2', label: 'ER Gateway', battery: 100, queueSize: 25, role: 'gateway', isFailed: false } },
        // Standalone node for varied connections
        { id: 'sX1', type: 'custom', position: { x: 600, y: 385 }, data: { id: 'sX1', label: 'S-X1 (Lab Eq)', battery: 88, queueSize: 4, role: 'sensor', isFailed: false } },

      ],
      edges: [
        // Wing A to Floor Router A
        { id: 'e-sA1-rA', source: 'sA1', target: 'rA', data: { latency: 10, bandwidth: 100 } },
        { id: 'e-sA2-rA', source: 'sA2', target: 'rA', data: { latency: 8, bandwidth: 80 } },
        { id: 'e-sA3-rA', source: 'sA3', target: 'rA', data: { latency: 12, bandwidth: 100 } },
        { id: 'e-sA4-rA', source: 'sA4', target: 'rA', data: { latency: 9, bandwidth: 80 } },
        { id: 'e-sA5-rA', source: 'sA5', target: 'rA', data: { latency: 15, bandwidth: 50 } },
        // Wing B to Floor Router B
        { id: 'e-sB1-rB', source: 'sB1', target: 'rB', data: { latency: 5, bandwidth: 150 } },
        { id: 'e-sB2-rB', source: 'sB2', target: 'rB', data: { latency: 7, bandwidth: 120 } },
        { id: 'e-sB3-rB', source: 'sB3', target: 'rB', data: { latency: 6, bandwidth: 150 } },
        { id: 'e-sB4-rB', source: 'sB4', target: 'rB', data: { latency: 20, bandwidth: 40 } },
        // Wing C to Floor Router C
        { id: 'e-sC1-rC', source: 'sC1', target: 'rC', data: { latency: 11, bandwidth: 100 } },
        { id: 'e-sC2-rC', source: 'sC2', target: 'rC', data: { latency: 10, bandwidth: 80 } },
        { id: 'e-sC3-rC', source: 'sC3', target: 'rC', data: { latency: 6, bandwidth: 60 } },
        // Floor Routers to Core Routers
        { id: 'e-rA-cR1', source: 'rA', target: 'cR1', data: { latency: 5, bandwidth: 300 } },
        { id: 'e-rB-cR2', source: 'rB', target: 'cR2', data: { latency: 4, bandwidth: 350 } },
        { id: 'e-rC-cR1', source: 'rC', target: 'cR1', data: { latency: 6, bandwidth: 290 } },
        // Inter-Core and Core to backup/alternative paths
        { id: 'e-cR1-cR2', source: 'cR1', target: 'cR2', data: { latency: 2, bandwidth: 1000 } },
        { id: 'e-rA-cR2', source: 'rA', target: 'cR2', data: { latency: 7, bandwidth: 250 } }, // rA to cR2
        { id: 'e-rB-cR1', source: 'rB', target: 'cR1', data: { latency: 7, bandwidth: 280 } }, // rB to cR1
        { id: 'e-rC-cR2', source: 'rC', target: 'cR2', data: { latency: 8, bandwidth: 240 } }, // rC to cR2
        // Lab Equipment sX1 connections
        { id: 'e-sX1-rB', source: 'sX1', target: 'rB', data: { latency: 12, bandwidth: 90 } },
        { id: 'e-sX1-cR2', source: 'sX1', target: 'cR2', data: { latency: 10, bandwidth: 150 } },
        // Core Routers to Gateways
        { id: 'e-cR1-gW1', source: 'cR1', target: 'gW1', data: { latency: 2, bandwidth: 800 } },
        { id: 'e-cR2-gW2', source: 'cR2', target: 'gW2', data: { latency: 2, bandwidth: 750 } },
        // Backup paths to gateways
        { id: 'e-cR1-gW2', source: 'cR1', target: 'gW2', data: { latency: 4, bandwidth: 500 } }, // Core 1 to ER Gateway
        { id: 'e-cR2-gW1', source: 'cR2', target: 'gW1', data: { latency: 4, bandwidth: 600 } }, // Core 2 to Main Gateway
        // Direct from ICU router to ER Gateway
        { id: 'e-rB-gW2', source: 'rB', target: 'gW2', data: { latency: 3, bandwidth: 500 } },
      ].map(e => ({ ...e, type: 'default', markerEnd: { type: MarkerType.ArrowClosed } })),
    },
  },
  {
    id: 'demo-scenario',
    name: '7. Algorithm & Failure Demo',
    description: 'A simple network to demonstrate algorithm differences and node failure re-routing.',
    data: {
      nodes: [
        { id: 'S', type: 'custom', position: { x: 50, y: 200 }, data: { id: 'S', label: 'Source S', battery: 95, queueSize: 2, role: 'sensor', isFailed: false } },
        { id: 'R1', type: 'custom', position: { x: 250, y: 100 }, data: { id: 'R1', label: 'Router R1', battery: 90, queueSize: 5, role: 'router', isFailed: false } },
        { id: 'R2', type: 'custom', position: { x: 250, y: 300 }, data: { id: 'R2', label: 'Router R2', battery: 95, queueSize: 20, role: 'router', isFailed: false } },
        { id: 'R3', type: 'custom', position: { x: 450, y: 200 }, data: { id: 'R3', label: 'Router R3', battery: 85, queueSize: 10, role: 'router', isFailed: false } },
        { id: 'T', type: 'custom', position: { x: 650, y: 200 }, data: { id: 'T', label: 'Target T', battery: 100, queueSize: 1, role: 'gateway', isFailed: false } },
      ],
      edges: [
        { id: 'eS-R1', source: 'S', target: 'R1', data: { latency: 5, bandwidth: 200 } },
        { id: 'eR1-T', source: 'R1', target: 'T', data: { latency: 5, bandwidth: 200 } }, // Path S-R1-T (Total Latency: 10)
        { id: 'eS-R2', source: 'S', target: 'R2', data: { latency: 8, bandwidth: 150 } },
        { id: 'eR2-T', source: 'R2', target: 'T', data: { latency: 8, bandwidth: 150 } }, // Path S-R2-T (Total Latency: 16)
        { id: 'eS-R3', source: 'S', target: 'R3', data: { latency: 7, bandwidth: 100 } },
        { id: 'eR3-R2', source: 'R3', target: 'R2', data: { latency: 7, bandwidth: 120 } }, // Path S-R3-R2-T (Total Latency S->R3->R2->T = 7+7+8 = 22)
         // Added direct edge from R3 to T to make R3 a more viable alternative intermediate for S->R3->T
        { id: 'eR3-T', source: 'R3', target: 'T', data: { latency: 12, bandwidth: 100 } }, // Path S-R3-T (Total Latency S->R3->T = 7+12 = 19)
      ].map(e => ({ ...e, type: 'default', markerEnd: { type: MarkerType.ArrowClosed } })),
    }
  },
];

  

    