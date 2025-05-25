
'use client';

import React from 'react';
import { useNetwork } from '@/context/network-context';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from '@/components/ui/chart';
import { BarChart, CartesianGrid, XAxis, YAxis, Bar, ResponsiveContainer } from 'recharts'; // Removed Tooltip, Legend as ChartTooltip/Legend are used
import { ScrollArea } from './ui/scroll-area';

export function PerformanceMetrics() {
  const { simulationResults, simulationParams } = useNetwork();

  if (!simulationResults || simulationResults.length === 0) {
    return (
      <Card className="h-1/3 border-t rounded-none border-none">
        <CardHeader className="p-4">
          <CardTitle className="text-lg">Performance Metrics</CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          <p className="text-sm text-muted-foreground">
            Run a simulation to see performance metrics.
          </p>
        </CardContent>
      </Card>
    );
  }

  const chartData = simulationResults.map(result => ({
    name: result.algorithm,
    energy: result.metrics.energyConsumption,
    latency: result.metrics.averageLatency,
    deliveryRatio: result.metrics.deliveryRatio * 100, // Convert to percentage
    lifetime: result.metrics.networkLifetime,
  }));

  const chartConfig = {
    energy: { label: 'Energy (units)', color: 'hsl(var(--chart-1))' },
    latency: { label: 'Latency (ms)', color: 'hsl(var(--chart-2))' },
    deliveryRatio: { label: 'Delivery (%)', color: 'hsl(var(--chart-3))' },
    lifetime: { label: 'Lifetime (steps)', color: 'hsl(var(--chart-4))' },
  };


  return (
    <Card className="h-1/3 border-t rounded-none border-none flex flex-col">
      <CardHeader className="p-4 pb-2">
        <CardTitle className="text-lg">Performance Metrics Comparison</CardTitle>
      </CardHeader>
      <CardContent className="flex-grow p-4 pt-0 flex flex-col overflow-hidden">
        {simulationParams.algorithm === 'compare' && simulationResults && simulationResults.length > 0 && (
          <p className="text-xs text-muted-foreground mb-2 text-center">
            (Canvas path displayed is for the <strong>Adaptive</strong> algorithm)
          </p>
        )}
        <div className="flex flex-1 flex-col lg:flex-row gap-4 overflow-hidden">
          <div className="w-full lg:w-1/2 h-full">
             <h4 className="text-sm font-medium mb-2 text-center">Metrics Overview</h4>
             <ChartContainer config={chartConfig} className="h-[calc(100%-2rem)] w-full">
                <ResponsiveContainer width="100%" height="100%">
                   <BarChart data={chartData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false}/>
                      <XAxis dataKey="name" tickLine={false} axisLine={false} tickMargin={8} fontSize={10}/>
                      <YAxis fontSize={10} tickMargin={5}/>
                      <ChartTooltip
                        content={<ChartTooltipContent indicator="dot" hideLabel />}
                        cursor={false}
                      />
                      <ChartLegend content={<ChartLegendContent />} />
                      <Bar dataKey="energy" fill="var(--color-energy)" radius={4} />
                      <Bar dataKey="latency" fill="var(--color-latency)" radius={4} />
                      <Bar dataKey="deliveryRatio" fill="var(--color-deliveryRatio)" radius={4} />
                      <Bar dataKey="lifetime" fill="var(--color-lifetime)" radius={4} />
                   </BarChart>
                </ResponsiveContainer>
             </ChartContainer>
          </div>
           <div className="w-full lg:w-1/2 h-full">
             <h4 className="text-sm font-medium mb-2 text-center">Detailed Table</h4>
             <ScrollArea className="h-[calc(100%-2rem)]">
               <Table>
                 <TableHeader>
                   <TableRow>
                     <TableHead className="w-[100px]">Algorithm</TableHead>
                     <TableHead className="text-right">Energy</TableHead>
                     <TableHead className="text-right">Latency</TableHead>
                     <TableHead className="text-right">Delivery %</TableHead>
                     <TableHead className="text-right">Lifetime</TableHead>
                   </TableRow>
                 </TableHeader>
                 <TableBody>
                   {simulationResults.map((result) => (
                     <TableRow key={result.algorithm}>
                       <TableCell className="font-medium text-xs">{result.algorithm}</TableCell>
                       <TableCell className="text-right text-xs">{result.metrics.energyConsumption.toFixed(2)}</TableCell>
                       <TableCell className="text-right text-xs">{result.metrics.averageLatency.toFixed(2)}</TableCell>
                       <TableCell className="text-right text-xs">{(result.metrics.deliveryRatio * 100).toFixed(1)}%</TableCell>
                       <TableCell className="text-right text-xs">{result.metrics.networkLifetime}</TableCell>
                     </TableRow>
                   ))}
                 </TableBody>
               </Table>
             </ScrollArea>
           </div>
        </div>
      </CardContent>
    </Card>
  );
}
