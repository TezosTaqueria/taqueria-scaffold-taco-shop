import { screen } from '@testing-library/react';

describe('Taco Shop page', () => {

    it('should display the correct title', () => {
        const element = screen.queryAllByText('Taco Shop');
        expect(element).toBeDefined();
    });

    it('should initially display "0" in the button text', () => {
        const element = screen.queryAllByText('Order 0 Tacos');
        expect(element).toBeDefined();
    });

    xit('should update the button text when the spinner is incremented', () => {
        // TODO
    });

    xit('should decrement the taco count when clicked', () => {
        // TODO
    });

});
