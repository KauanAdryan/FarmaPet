// Proteção de Autenticação Global
// Este arquivo deve ser incluído em todas as páginas HTML para garantir proteção

(function() {
    'use strict';
    
    // Função de verificação de autenticação
    function checkUserLoggedIn() {
        const isLoggedIn = localStorage.getItem('userLoggedIn');
        const currentPath = window.location.pathname;
        const currentHref = window.location.href;
        
        console.log('🔒 Verificando autenticação:', {
            isLoggedIn: isLoggedIn,
            currentPath: currentPath,
            currentHref: currentHref
        });
        
        // Verifica se não está logado e não está na página de login
        if (!isLoggedIn && 
            !currentPath.includes('login.html') && 
            !currentHref.includes('login.html')) {
            
            console.log('❌ Usuário não autenticado, redirecionando para login...');
            window.location.href = 'login.html';
            return false;
        }
        
        console.log('✅ Usuário autenticado ou na página de login');
        return true;
    }
    
    // Função para fazer logout
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
                
                console.log('✅ Logout realizado com sucesso');
                
                // Mostra mensagem visual se possível
                if (typeof showMessage === 'function') {
                    showMessage('👋 Logout realizado com sucesso! Até logo!', 'success');
                } else {
                    alert('👋 Logout realizado com sucesso! Até logo!');
                }
                
                // Redireciona para a página de login após 1 segundo
                setTimeout(() => {
                    window.location.href = 'login.html';
                }, 1000);
            } else {
                console.error('❌ Erro ao fazer logout');
                if (typeof showMessage === 'function') {
                    showMessage('⚠️ Erro ao fazer logout. Tente novamente.', 'error');
                } else {
                    alert('⚠️ Erro ao fazer logout. Tente novamente.');
                }
            }
        } catch (error) {
            console.error('❌ Erro ao conectar com o servidor:', error);
            if (typeof showMessage === 'function') {
                showMessage('🔌 Erro de conexão ao fazer logout.', 'error');
            } else {
                alert('🔌 Erro de conexão ao fazer logout.');
            }
        }
    }
    
    // Configura o logout se o botão existir
    function setupLogout() {
        const logoutBtn = document.getElementById('btnLogout');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', function(e) {
                e.preventDefault();
                performLogout();
            });
            console.log('🔧 Botão de logout configurado');
        }
    }
    
    // Executa a verificação imediatamente
    function initAuthProtection() {
        console.log('🚀 Iniciando proteção de autenticação...');
        
        // Verifica autenticação
        checkUserLoggedIn();
        
        // Configura logout
        setupLogout();
        
        console.log('✅ Proteção de autenticação ativada');
    }
    
    // Executa quando o DOM estiver pronto
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initAuthProtection);
    } else {
        // DOM já está pronto
        initAuthProtection();
    }
    
    // Também executa imediatamente para casos onde o script é carregado após o DOM
    initAuthProtection();
    
})(); 