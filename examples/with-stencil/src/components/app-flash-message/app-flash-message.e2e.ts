import { newE2EPage } from '@stencil/core/testing';

describe('app-flash-message', () => {
  it('renders', async () => {
    const page = await newE2EPage();

    await page.setContent('<app-flash-message></app-flash-message>');
    const element = await page.find('app-flash-message');
    expect(element).toHaveClass('hydrated');
  });
});
