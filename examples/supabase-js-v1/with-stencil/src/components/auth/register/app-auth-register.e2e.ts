import { newE2EPage } from '@stencil/core/testing';

describe('app-auth-register', () => {
  it('renders', async () => {
    const page = await newE2EPage();
    await page.setContent('<app-auth-register></app-auth-register>');

    const element = await page.find('app-auth-register');
    expect(element).toHaveClass('hydrated');
  });
});
