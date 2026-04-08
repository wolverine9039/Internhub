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
        DOCKER_SERVER = '3.221.77.93'
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
                git branch: 'master',
                   // credentialsId: 'github-credentials',        // ← your Jenkins credential ID
                    url: 'https://github.com/wolverine9039/Internhub.git'
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
                withSonarQubeEnv('sonar qube') {             // ← must match name in Manage Jenkins > System > SonarQube servers
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
                    waitForQualityGate abortPipeline: false
                }
            }
        }

        // ── Stage 8: Deploy to App Server ───────────────────
        stage('Deploy with Ansible') {
            steps {
                sh '''
                    ANSIBLE_HOST_KEY_CHECKING=False \
                    ansible-playbook /var/lib/jenkins/playbooks/deployment.yaml \
                    -i "${DOCKER_SERVER}," \
                    -u root \
                    --private-key /var/lib/jenkins/.ssh/id_ed25519 \
                    -e "workspace_path=${WORKSPACE}" \
                    -v
                '''
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
