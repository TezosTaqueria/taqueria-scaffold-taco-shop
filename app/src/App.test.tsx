import { screen } from '@testing-library/react';

describe('Taco Shop page', () => {
  test('displays the correct title', () => {
    const titleValue = screen.queryAllByText('Taco Shop');
    expect(titleValue).toBeDefined();
  });
});
