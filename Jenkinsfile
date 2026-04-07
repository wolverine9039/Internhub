// ─── InternHub CI/CD Pipeline ────────────────────────────────
// Jenkins Declarative Pipeline
// Stages: Checkout → Install → Lint → Test → SonarQube → Deploy

pipeline {
    agent any

    tools {
        nodejs 'NodeJS-20'
    }

    environment {
        SCANNER_HOME = tool 'SonarScanner'
    }

    options {
        timeout(time: 30, unit: 'MINUTES')
        disableConcurrentBuilds()
        buildDiscarder(logRotator(numToKeepStr: '10'))
        timestamps()
    }

    stages {
        // ── Stage 1: Checkout Code ──────────────────────────
        stage('Checkout') {
            steps {
                echo '📥 Checking out source code...'
                checkout scm
            }
        }

        // ── Stage 2: Install Dependencies ───────────────────
        stage('Install Dependencies') {
            parallel {
                stage('Backend Dependencies') {
                    steps {
                        dir('backend') {
                            echo '📦 Installing backend dependencies...'
                            sh 'npm ci'
                        }
                    }
                }
                stage('Frontend Dependencies') {
                    steps {
                        dir('frontend') {
                            echo '📦 Installing frontend dependencies...'
                            sh 'npm ci'
                        }
                    }
                }
            }
        }

        // ── Stage 3: Lint Frontend ──────────────────────────
        stage('Lint') {
            steps {
                dir('frontend') {
                    echo '🔍 Running ESLint on frontend...'
                    sh 'npm run lint'
                }
            }
        }

        // ── Stage 4: Backend Tests (Jest) ───────────────────
        stage('Backend Tests') {
            steps {
                dir('backend') {
                    echo '🧪 Running Jest tests with coverage...'
                    sh 'npm test'
                }
            }
        }

        // ── Stage 5: Frontend Build ─────────────────────────
        stage('Frontend Build') {
            steps {
                dir('frontend') {
                    echo '🏗️ Building frontend for production...'
                    sh 'npm run build'
                }
            }
        }

        // ── Stage 6: SonarQube Analysis ─────────────────────
        stage('SonarQube Analysis') {
            steps {
                echo '📊 Running SonarQube code analysis...'
                withSonarQubeEnv('SonarQube') {
                    sh """
                        ${SCANNER_HOME}/bin/sonar-scanner \
                            -Dsonar.projectKey=internhub \
                            -Dsonar.projectName=InternHub \
                            -Dsonar.sources=backend/src,frontend/src \
                            -Dsonar.exclusions=**/node_modules/**,**/dist/**,**/coverage/** \
                            -Dsonar.javascript.lcov.reportPaths=backend/coverage/lcov.info
                    """
                }
            }
        }

        // ── Stage 7: Quality Gate ───────────────────────────
        stage('Quality Gate') {
            steps {
                echo '🚦 Waiting for SonarQube quality gate...'
                timeout(time: 5, unit: 'MINUTES') {
                    waitForQualityGate abortPipeline: true
                }
            }
        }

        // ── Stage 8: Deploy to App Server ───────────────────
        stage('Deploy') {
            steps {
                echo '🚀 Deploying to App Server via Ansible...'
                ansiblePlaybook(
                    playbook: 'deployment/ansible/deploy.yml',
                    inventory: 'deployment/ansible/inventory.ini',
                    credentialsId: 'app-server-ssh-key',
                    colorized: true,
                    extras: '-v'
                )
            }
        }
    }

    // ── Post-Build Actions ──────────────────────────────────
    post {
        success {
            echo '''
            ═══════════════════════════════════════════
               ✅ Pipeline Completed Successfully!
            ═══════════════════════════════════════════
               URL: https://internhub.buildwithmayank.tech
            ═══════════════════════════════════════════
            '''
        }
        failure {
            echo '''
            ═══════════════════════════════════════════
               ❌ Pipeline Failed!
            ═══════════════════════════════════════════
               Check console output for details.
            ═══════════════════════════════════════════
            '''
        }
        always {
            cleanWs()
        }
    }
}
