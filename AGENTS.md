# AGENTS.md

## Development Instructions for Autonomous Agents & Pair Programmers

When working on this repository, all agents must adhere to the following principles:

1. **Phase Discipline**: Always focus on the active phase deliverables. Do not jump ahead to speculative features without completing the current milestone criteria.
2. **Deterministic Fallbacks**: Always provide a zero-dependency Demo Mode so frontend features can be tested and showcased immediately without a live RabbitMQ broker.
3. **No Secret Leaks**: Never hardcode RabbitMQ passwords or sensitive configuration keys in frontend code, git commits, or client-side bundles.
4. **Visual Scaling**: Keep metrics numerically exact in the UI, but scale visual game objects using logarithmic dampening to maintain a strict 60 FPS budget.
5. **Clean Verification**: Run automated tests and build checks after every milestone before marking tasks complete.
