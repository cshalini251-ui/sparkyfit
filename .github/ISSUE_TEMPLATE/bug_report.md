---
name: Bug Report
about: Report a reproducible bug or unexpected behavior
title: "[Bug]: "
labels: ["bug", "triage"]
assignees: ""
---

## Important: Log Requirement for Troubleshooting

To effectively troubleshoot and resolve issues, it is crucial to provide relevant server and/or browser console logs that replicate the problem. Issues submitted without adequate logs may be difficult to diagnose and are at risk of being automatically closed.

## Bug Description

A clear and concise description of what the bug is.

## Steps to Reproduce

Steps to reproduce the behavior:
1. Go to '...'
2. Click on '....'
3. Scroll down to '....'
4. See error

## Expected Behavior

A clear and concise description of what you expected to happen.

## Actual Behavior

A clear and concise description of what actually happened.

## Environment

- **SparkyFitness Version:** [e.g., 1.0.0, commit hash]
- **Running Env:** [e.g. Docker, Podmon, Directly running]



## Relevant Environment Variables (if applicable)

Please list any environment variables you have set that might be relevant to this issue (e.g., API keys, specific configuration flags). **Do not share sensitive information like full API keys or passwords.**

```
# Example:
# SPARKY_FITNESS_LOG_LEVEL=DEBUG
# NODE_ENV=development
# TZ=Etc/UTC
```

## Preference Settings
Screenshot of your preference settings

## Browser Console Log

Please open your browser's developer tools (usually F12 or Ctrl+Shift+I), go to the "Console" tab, and copy-paste any relevant error messages or warnings that appear when the bug occurs.

Make sure you are cleaning the log before re-producing the steps to minimize the total log submitted.

```
# Paste console log here
```

## Container Log for SparkyFitness

Please provide the container logs for the `sparkyfitness` service. You can usually obtain these logs using `docker logs sparkyfitness` or by checking your container orchestration platform's logging interface.

```
# Paste SparkyFitness container log here
```

## Container Log for SparkyFitness_Server

Please provide the container logs for the `sparkyfitness_server` service. You can usually obtain these logs using `docker logs sparkyfitness_server` or by checking your container orchestration platform's logging interface.

```
# Paste SparkyFitness_Server container log here
```

## Screenshots/Videos (Optional)

If applicable, add screenshots or a short video to help explain your problem.

## Additional Context

Add any other context about the problem here.