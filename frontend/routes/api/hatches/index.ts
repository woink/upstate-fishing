import { Handlers } from '$fresh/server.ts';
import { HATCHES } from '@shared/data/hatches.ts';
import { InsectOrderSchema } from '@shared/models/types.ts';
import { apiError, apiSuccessList } from '../../../utils/api-response.ts';

export const handler: Handlers = {
  GET(req, _ctx) {
    const url = new URL(req.url);
    const order = url.searchParams.get('order');
    const month = url.searchParams.get('month');

    let hatches = [...HATCHES];

    if (order) {
      const validOrder = InsectOrderSchema.safeParse(order);
      if (!validOrder.success) {
        return apiError('Invalid order parameter', 'VALIDATION_ERROR', 400);
      }
      hatches = hatches.filter((h) => h.order === validOrder.data);
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
