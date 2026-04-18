import { useEffect, useRef } from 'react';
import {
  forceSimulation,
  forceLink,
  forceManyBody,
  forceCenter,
  forceCollide,
  type Simulation,
  type SimulationNodeDatum,
  type SimulationLinkDatum,
} from 'd3-force';
import type { Category } from '@lib/categories';

export interface SimNode extends SimulationNodeDatum {
  id: string;
  title: string;
  category: Category;
  visibility: 'public' | 'private';
  size: number;
  age_days: number;
  tags: string[];
  radius: number;
}

export interface SimLink extends SimulationLinkDatum<SimNode> {
  source: string | SimNode;
  target: string | SimNode;
  strength: number;
  reason?: string;
}

export function useGraphPhysics(
  nodes: SimNode[],
  links: SimLink[],
  width: number,
  height: number,
  onTick: () => void,
) {
  const simRef = useRef<Simulation<SimNode, SimLink> | null>(null);

  useEffect(() => {
    if (!nodes.length || width <= 0 || height <= 0) return;

    const sim = forceSimulation<SimNode>(nodes)
      .force(
        'link',
        forceLink<SimNode, SimLink>(links)
          .id((d) => d.id)
          .distance(140)
          .strength((l) => 0.15 + l.strength * 0.35),
      )
      .force('charge', forceManyBody<SimNode>().strength(-320).distanceMax(520))
      .force('center', forceCenter(width / 2, height / 2).strength(0.06))
      .force(
        'collide',
        forceCollide<SimNode>()
          .radius((n) => n.radius + 10)
          .iterations(2),
      )
      .alphaDecay(0.025)
      .velocityDecay(0.35)
      .on('tick', onTick);

    simRef.current = sim;

    return () => {
      sim.stop();
      simRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nodes, links, width, height]);

  return {
    reheat(alpha = 0.5) {
      simRef.current?.alpha(alpha).restart();
    },
    simulation: () => simRef.current,
  };
}
