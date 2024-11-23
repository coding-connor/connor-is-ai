# Tiltfile
load('ext://restart_process', 'docker_build_with_restart')

# Load config
# Default is dev, but can do: tilt up -- prod to build frontend in prod mode
config.define_string(name="build_mode", args=False, usage="Mode to build frontend: dev or prod")
cfg = config.parse()

# Backend live updates
docker_build_with_restart(
    'connor-backend',
    './backend',
    live_update=[
        sync('./backend', '/app'),
        run('pip install -r requirements.txt', trigger='./backend/requirements.txt')
    ],
    entrypoint=['uvicorn', 'gen_ui_backend.server:app', '--host', '0.0.0.0', '--port', '8000']
)

# Frontend build configuration
# Use: tilt up -- --build_mode=prod
if cfg.get('build_mode') == 'prod':
    docker_build_with_restart(
        'connor-frontend', 
        './frontend',
        dockerfile='frontend/Dockerfile',
        build_args={
            'NEXT_PUBLIC_CLERK_SIGN_IN_URL': '/sign-in',
            'NEXT_PUBLIC_CLERK_SIGN_UP_URL': '/sign-up',
            'NEXT_PUBLIC_BACKEND_URL': 'http://localhost:8000'
        },
        entrypoint=['npm', 'start'],
        live_update=[
            sync('./frontend', '/app'),
            run('npm install', trigger='./frontend/package.json')
        ]
    )
else:
    docker_build_with_restart(
        'connor-frontend', 
        './frontend',
        dockerfile='frontend/Dockerfile.dev',
        live_update=[
            sync('./frontend', '/app'),
            run('npm install', trigger='./frontend/package.json')
        ],
        entrypoint=['npm', 'run', 'dev']
    )

# Helm configuration
k8s_yaml(helm(
    'helm',
    name='myapp',
    values=[
        'helm/values.yaml',
        'helm/values-dev.yaml', 
        'helm/secrets-dev.yaml'
    ]
))

# Resource configuration
k8s_resource('connor-frontend', port_forwards='3000:3000')
k8s_resource('connor-backend', port_forwards='8000:8000')

watch_file('helm')