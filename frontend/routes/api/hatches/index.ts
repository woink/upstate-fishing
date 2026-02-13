import { Handlers } from '$fresh/server.ts';
import { HATCHES } from '@shared/data/hatches.ts';
import { apiSuccessList } from '../../../utils/api-response.ts';

export const handler: Handlers = {
  GET(req, _ctx) {
    const url = new URL(req.url);
    const order = url.searchParams.get('order');
    const month = url.searchParams.get('month');

    let hatches = [...HATCHES];

    if (order) {
      hatches = hatches.filter((h) => h.order === order);
    }

    if (month) {
      const monthNum = parseInt(month, 10);
      if (!isNaN(monthNum) && monthNum >= 1 && monthNum <= 12) {
        hatches = hatches.filter((h) => h.peakMonths.includes(monthNum));
      }
    }

    return apiSuccessList(hatches);
  },
};
