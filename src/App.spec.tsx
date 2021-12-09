import React from 'react'
import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import { App } from './App'

describe('test', () => {
  it('renders', () => {
    render(<App />)
    expect(screen.getByRole('heading')).toHaveTextContent('React TypeScript Template')
  })
})
