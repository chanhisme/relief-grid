import type { Station } from '../../types/models';
import { alternativesForItem } from '../../lib/suggest';
import { calcS } from '../../lib/needLogic';

export function stationsForAlternatives(stations: Station[], excludeId: string, itemId: string, limit = 3) {
  return alternativesForItem(stations, itemId, excludeId, limit).map((st) => ({
    station: st,
    s: calcS(st.needs.find((n) => n.itemId === itemId)!),
  }));
}
