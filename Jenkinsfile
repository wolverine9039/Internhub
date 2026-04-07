// ─── InternHub CI/CD Pipeline ────────────────────────────────
// Jenkins Declarative Pipeline
// Stages: Checkout → Install → Lint → Test → SonarQube → Deploy

pipeline {
    agent any

    environment {
        NODEJS_HOME     = tool(name: 'NodeJS-20', type: 'nodejs')
        PATH            = "${NODEJS_HOME}/bin:${env.PATH}"
        SONAR_SCANNER   = tool(name: 'SonarScanner', type: 'hudson.plugins.sonar.SonarRunnerInstallation')
        APP_SERVER_IP   = credentials('app-server-ip')
    }

    options {
        timeout(time: 30, unit: 'MINUTES')
        disableConcurrentBuilds()
        buildDiscarder(logRotator(numToKeepStr: '10'))
        timestamps()
    }

    triggers {
        githubPush()
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
                    sh 'npm test -- --ci --coverage --reporters=default --reporters=jest-junit'
                }
            }
            post {
                always {
                    // Publish test results
                    junit allowEmptyResults: true, testResults: 'backend/junit.xml'

                    // Publish coverage report
                    publishHTML(target: [
                        allowMissing: true,
                        alwaysLinkToLastBuild: true,
                        keepAll: true,
                        reportDir: 'backend/coverage/lcov-report',
                        reportFiles: 'index.html',
                        reportName: 'Backend Coverage Report'
                    ])
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
                withSonarQubeEnv('InternHub-SonarQube') {
                    sh """
                        ${SONAR_SCANNER}/bin/sonar-scanner \
                            -Dproject.settings=deployment/jenkins/sonar-project.properties \
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
            when {
                branch 'master'
            }
            steps {
                echo '🚀 Deploying to App Server via Ansible...'
                dir('deployment/ansible') {
                    ansiblePlaybook(
                        playbook: 'deploy.yml',
                        inventory: 'inventory.ini',
                        credentialsId: 'app-server-ssh-key',
                        colorized: true,
                        extras: '-v'
                    )
                }
            }
        }
    }

    // ── Post-Build Actions ──────────────────────────────────
    post {
        success {
            echo """
            ═══════════════════════════════════════════
               ✅ Pipeline Completed Successfully!
            ═══════════════════════════════════════════
               Build:   #${env.BUILD_NUMBER}
               Branch:  ${env.BRANCH_NAME}
               URL:     https://internhub.buildwithmayank.tech
            ═══════════════════════════════════════════
            """
        }
        failure {
            echo """
            ═══════════════════════════════════════════
               ❌ Pipeline Failed!
            ═══════════════════════════════════════════
               Build:   #${env.BUILD_NUMBER}
               Branch:  ${env.BRANCH_NAME}
               Check console output for details.
            ═══════════════════════════════════════════
            """
        }
        cleanup {
            cleanWs()
        }
    }
}
