@echo off
REM ============ ROOT FILES ============
type nul > docker-compose.yml
type nul > .env
type nul > .gitignore
type nul > README.md

REM ============ BACKEND ============
mkdir backend\config\settings
type nul > backend\manage.py
type nul > backend\requirements.txt
type nul > backend\Dockerfile
type nul > backend\config\__init__.py
type nul > backend\config\settings\__init__.py
type nul > backend\config\settings\base.py
type nul > backend\config\settings\dev.py
type nul > backend\config\settings\prod.py
type nul > backend\config\urls.py
type nul > backend\config\wsgi.py
type nul > backend\config\asgi.py

REM ============ BACKEND APPS (with migrations, models, views, urls) ============
for %%A in (core accounts shops devices platform_admin products billing purchases customers suppliers expenses notifications feedback reports) do (
    mkdir backend\apps\%%A\migrations
    type nul > backend\apps\%%A\__init__.py
    type nul > backend\apps\%%A\migrations\__init__.py
    type nul > backend\apps\%%A\models.py
    type nul > backend\apps\%%A\views.py
    type nul > backend\apps\%%A\urls.py
)

REM ============ serializers.py for apps that need it ============
for %%A in (accounts shops devices products billing purchases customers suppliers expenses notifications feedback) do (
    type nul > backend\apps\%%A\serializers.py
)

REM ============ core app extras ============
type nul > backend\apps\core\managers.py
type nul > backend\apps\core\permissions.py
type nul > backend\apps\core\mixins.py

REM ============ devices app extra ============
type nul > backend\apps\devices\signals.py

REM ============ products app extra ============
type nul > backend\apps\products\bulk.py

REM ============ billing app extra ============
type nul > backend\apps\billing\invoice.py

REM ============ platform_admin: remove unneeded models.py ============
del backend\apps\platform_admin\models.py

REM ============ FRONTEND ============
mkdir frontend\src\api
mkdir frontend\src\context
mkdir frontend\src\hooks
mkdir frontend\src\components\ui
mkdir frontend\src\components\ChromaGrid
mkdir frontend\src\components\BlurText
mkdir frontend\src\pages\auth
mkdir frontend\src\pages\platform-admin
mkdir frontend\src\pages\shop

type nul > frontend\package.json
type nul > frontend\vite.config.js
type nul > frontend\index.html
type nul > frontend\Dockerfile
type nul > frontend\src\main.jsx
type nul > frontend\src\App.jsx

REM ---- api ----
type nul > frontend\src\api\axiosClient.js
type nul > frontend\src\api\authApi.js
type nul > frontend\src\api\shopApi.js
type nul > frontend\src\api\productApi.js
type nul > frontend\src\api\billingApi.js
type nul > frontend\src\api\purchaseApi.js
type nul > frontend\src\api\customerApi.js
type nul > frontend\src\api\supplierApi.js
type nul > frontend\src\api\expenseApi.js
type nul > frontend\src\api\notificationApi.js
type nul > frontend\src\api\feedbackApi.js
type nul > frontend\src\api\reportApi.js
type nul > frontend\src\api\deviceApi.js

REM ---- context ----
type nul > frontend\src\context\AuthContext.jsx
type nul > frontend\src\context\ShopContext.jsx

REM ---- hooks ----
type nul > frontend\src\hooks\useAuth.js
type nul > frontend\src\hooks\useFetch.js

REM ---- components/ui ----
type nul > frontend\src\components\ui\Button.jsx
type nul > frontend\src\components\ui\Modal.jsx
type nul > frontend\src\components\ui\Input.jsx
type nul > frontend\src\components\ui\Badge.jsx
type nul > frontend\src\components\ui\Sidebar.jsx
type nul > frontend\src\components\ui\Topbar.jsx

REM ---- components/ChromaGrid ----
type nul > frontend\src\components\ChromaGrid\ChromaGrid.jsx
type nul > frontend\src\components\ChromaGrid\ChromaGrid.css

REM ---- components/BlurText ----
type nul > frontend\src\components\BlurText\BlurText.jsx

REM ---- pages/auth ----
type nul > frontend\src\pages\auth\LoginPage.jsx
type nul > frontend\src\pages\auth\RegisterPage.jsx

REM ---- pages/platform-admin ----
type nul > frontend\src\pages\platform-admin\AdminDashboardPage.jsx
type nul > frontend\src\pages\platform-admin\ShopApprovalsPage.jsx
type nul > frontend\src\pages\platform-admin\ShopListPage.jsx
type nul > frontend\src\pages\platform-admin\ShopDevicesPage.jsx
type nul > frontend\src\pages\platform-admin\AnalyticsPage.jsx
type nul > frontend\src\pages\platform-admin\NotificationsPage.jsx
type nul > frontend\src\pages\platform-admin\FeedbackInboxPage.jsx

REM ---- pages/shop ----
type nul > frontend\src\pages\shop\DashboardPage.jsx
type nul > frontend\src\pages\shop\ProductsPage.jsx
type nul > frontend\src\pages\shop\BillingPage.jsx
type nul > frontend\src\pages\shop\PurchasesPage.jsx
type nul > frontend\src\pages\shop\CustomersPage.jsx
type nul > frontend\src\pages\shop\SuppliersPage.jsx
type nul > frontend\src\pages\shop\ExpensesPage.jsx
type nul > frontend\src\pages\shop\ReportsPage.jsx
type nul > frontend\src\pages\shop\DevicesPage.jsx
type nul > frontend\src\pages\shop\NotificationsPage.jsx
type nul > frontend\src\pages\shop\FeedbackPage.jsx
type nul > frontend\src\pages\shop\SettingsPage.jsx

echo Done — project structure created successfully.