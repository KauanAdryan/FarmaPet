// script.js para autenticação com API Spring Boot

document.addEventListener('DOMContentLoaded', function() {
    // Verifica se está na página de login
    if (document.getElementById('loginForm')) {
        setupLogin();
    }
    
    // Configura o logout se o botão existir
    const logoutBtn = document.getElementById('btnLogout');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function(e) {
            e.preventDefault();
            performLogout();
        });
    }
});

function setupLogin() {
    const loginForm = document.getElementById('loginForm');
    
    loginForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        
        // Validação básica
        if (!username || !password) {
            showMessage('⚠️ Por favor, preencha todos os campos obrigatórios', 'error');
            return;
        }
        
        try {
            // Configuração da requisição para a API Spring Boot
            const formData = new FormData();
            formData.append('username', username);
            formData.append('password', password);
            
            const response = await fetch('http://localhost:8080/login', {
                method: 'POST',
                credentials: 'include', // Inclui cookies para sessão
                body: formData
            });
            
            if (response.ok) {
                // Login bem-sucedido
                const data = await response.json();
                showMessage('🎉 Login realizado com sucesso! Redirecionando...', 'success');
                
                // Armazena informações do usuário logado (opcional)
                localStorage.setItem('userLoggedIn', 'true');
                localStorage.setItem('username', username);
                
                // Redireciona para a página inicial após 1.5 segundos
                setTimeout(() => {
                    window.location.href = 'telaInicial.html';
                }, 1500);
            } else if (response.status === 401) {
                // Credenciais inválidas
                const data = await response.json();
                showMessage('🔐 Usuário ou senha incorretos. Tente novamente.', 'error');
            } else {
                // Outros erros
                showMessage('⚠️ Erro no servidor. Tente novamente em alguns instantes.', 'error');
            }
        } catch (error) {
            console.error('Erro ao fazer login:', error);
            
            // Verifica se é erro de CORS
            if (error.message.includes('Failed to fetch') || error.message.includes('CORS')) {
                showMessage('🌐 Erro de conexão: Verifique se o servidor está rodando e acessível.', 'error');
            } else {
                showMessage('🔌 Erro de conexão: Verifique se a API está funcionando corretamente.', 'error');
            }
        }
    });
}

async function performLogout() {
    try {
        const response = await fetch('http://localhost:8080/logout', {
            method: 'POST',
            credentials: 'include'
        });
        
        if (response.ok) {
            // Limpa dados locais
            localStorage.removeItem('userLoggedIn');
            localStorage.removeItem('username');
            
            showMessage('👋 Logout realizado com sucesso! Até logo!', 'success');
            
            // Redireciona para a página de login após 1 segundo
            setTimeout(() => {
                window.location.href = 'login.html';
            }, 1000);
        } else {
            showMessage('⚠️ Erro ao fazer logout. Tente novamente.', 'error');
        }
    } catch (error) {
        console.error('Erro ao fazer logout:', error);
        showMessage('🔌 Erro de conexão ao fazer logout.', 'error');
    }
}

// Função para verificar se o usuário está logado
function checkUserLoggedIn() {
    const isLoggedIn = localStorage.getItem('userLoggedIn');
    const currentPath = window.location.pathname;
    const currentHref = window.location.href;
    
    console.log('Verificando autenticação:', {
        isLoggedIn: isLoggedIn,
        currentPath: currentPath,
        currentHref: currentHref
    });
    
    // Verifica se não está logado e não está na página de login
    if (!isLoggedIn && 
        !currentPath.includes('login.html') && 
        !currentHref.includes('login.html')) {
        
        console.log('Usuário não autenticado, redirecionando para login...');
        window.location.href = 'login.html';
        return false;
    }
    
    console.log('Usuário autenticado ou na página de login');
    return true;
}

// Função para obter o username do usuário logado
function getLoggedInUsername() {
    return localStorage.getItem('username');
}

function showMessage(message, type) {
    const messageContainer = document.getElementById('message-container') || createMessageContainer();
    
    const messageElement = document.createElement('div');
    messageElement.className = `message ${type}`;
    messageElement.innerHTML = `
        <div class="message-content">
            <div class="message-icon">
                ${type === 'success' ? '✅' : type === 'error' ? '❌' : 'ℹ️'}
            </div>
            <div class="message-text">${message}</div>
        </div>
    `;
    messageElement.setAttribute('role', 'alert');
    
    // Estilos base da mensagem
    messageElement.style.cssText = `
        padding: 16px 20px;
        border-radius: 12px;
        margin-bottom: 12px;
        font-weight: 500;
        font-size: 14px;
        line-height: 1.4;
        max-width: 400px;
        transform: translateX(100%);
        opacity: 0;
        transition: all 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55);
        backdrop-filter: blur(10px);
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
    `;
    
    // Estilos específicos para cada tipo
    if (type === 'success') {
        messageElement.style.cssText += `
            background: linear-gradient(135deg, #d4edda 0%, #c3e6cb 100%);
            color: #155724;
            border: 2px solid #c3e6cb;
            border-left: 4px solid #28a745;
            box-shadow: 0 8px 32px rgba(40, 167, 69, 0.2);
        `;
    } else if (type === 'error') {
        messageElement.style.cssText += `
            background: linear-gradient(135deg, #f8d7da 0%, #f5c6cb 100%);
            color: #721c24;
            border: 2px solid #f5c6cb;
            border-left: 4px solid #dc3545;
            box-shadow: 0 8px 32px rgba(220, 53, 69, 0.2);
        `;
    } else {
        messageElement.style.cssText += `
            background: linear-gradient(135deg, #d1ecf1 0%, #bee5eb 100%);
            color: #0c5460;
            border: 2px solid #bee5eb;
            border-left: 4px solid #17a2b8;
            box-shadow: 0 8px 32px rgba(23, 162, 184, 0.2);
        `;
    }
    
    // Estilos para o conteúdo interno
    const messageContent = messageElement.querySelector('.message-content');
    messageContent.style.cssText = `
        display: flex;
        align-items: center;
        gap: 12px;
    `;
    
    const messageIcon = messageElement.querySelector('.message-icon');
    messageIcon.style.cssText = `
        font-size: 18px;
        flex-shrink: 0;
        animation: bounce 0.6s ease-in-out;
    `;
    
    const messageText = messageElement.querySelector('.message-text');
    messageText.style.cssText = `
        flex: 1;
        word-wrap: break-word;
    `;
    
    messageContainer.appendChild(messageElement);
    
    // Animação de entrada
    setTimeout(() => {
        messageElement.style.transform = 'translateX(0)';
        messageElement.style.opacity = '1';
    }, 10);
    
    // Remove a mensagem após 5 segundos com animação de saída
    setTimeout(() => {
        messageElement.style.transform = 'translateX(100%)';
        messageElement.style.opacity = '0';
        setTimeout(() => messageElement.remove(), 300);
    }, 5000);
}

function createMessageContainer() {
    const container = document.createElement('div');
    container.id = 'message-container';
    container.className = 'position-fixed top-0 end-0 p-3';
    container.style.zIndex = '11';
    container.style.maxWidth = '400px';
    container.setAttribute('role', 'status');
    container.setAttribute('aria-live', 'polite');
    document.body.appendChild(container);
    return container;
}

// Adiciona CSS para animação de bounce
const style = document.createElement('style');
style.textContent = `
    @keyframes bounce {
        0%, 20%, 50%, 80%, 100% {
            transform: translateY(0);
        }
        40% {
            transform: translateY(-10px);
        }
        60% {
            transform: translateY(-5px);
        }
    }
`;
document.head.appendChild(style);

// Exporta funções para uso em outros arquivos (se necessário)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        checkUserLoggedIn,
        getLoggedInUsername,
        performLogout
    };
}