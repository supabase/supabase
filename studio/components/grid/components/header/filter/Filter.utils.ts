import AwesomeDebouncePromise from 'awesome-debounce-promise';
import { Filter } from '../../../types';

const updateFilterValue = (
  payload: {
    filterIdx: number;
    value: Filter;
  },
  dispatch: (value: unknown) => void
) => {
  dispatch({
    type: 'UPDATE_FILTER',
    payload: payload,
  });
};
export const updateFilterValueDebounced = AwesomeDebouncePromise(
  updateFilterValue,
  550
);
