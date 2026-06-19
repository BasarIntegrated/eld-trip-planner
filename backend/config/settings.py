"""
Django settings for the Spotter AI trip planner API.
"""

import os
from pathlib import Path

from django.core.exceptions import ImproperlyConfigured
from dotenv import load_dotenv

load_dotenv()

BASE_DIR = Path(__file__).resolve().parent.parent

_DEV_SECRET_KEY = "django-insecure-dev-only-change-me"
SECRET_KEY = os.getenv("DJANGO_SECRET_KEY", _DEV_SECRET_KEY)
DEBUG = os.getenv("DJANGO_DEBUG", "True").lower() == "true"

if not DEBUG and (not SECRET_KEY or SECRET_KEY == _DEV_SECRET_KEY):
    raise ImproperlyConfigured(
        "Set a unique DJANGO_SECRET_KEY when DJANGO_DEBUG is False."
    )


def _csv_env(name: str, default: str) -> list[str]:
    return [item.strip() for item in os.getenv(name, default).split(",") if item.strip()]


ALLOWED_HOSTS = _csv_env("ALLOWED_HOSTS", "localhost,127.0.0.1")

# Railway: allow public hostname and all *.railway.app subdomains (official guide pattern).
_railway_domain = os.getenv("RAILWAY_PUBLIC_DOMAIN", "").strip()
if _railway_domain and _railway_domain not in ALLOWED_HOSTS:
    ALLOWED_HOSTS.append(_railway_domain)
if os.getenv("RAILWAY_ENVIRONMENT"):
    for host in (".railway.app", ".up.railway.app"):
        if host not in ALLOWED_HOSTS:
            ALLOWED_HOSTS.append(host)

INSTALLED_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    "corsheaders",
    "rest_framework",
    "trip",
]

MIDDLEWARE = [
    "corsheaders.middleware.CorsMiddleware",
    "django.middleware.security.SecurityMiddleware",
    "whitenoise.middleware.WhiteNoiseMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

ROOT_URLCONF = "config.urls"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

WSGI_APPLICATION = "config.wsgi.application"

DATABASE_URL = os.getenv("DATABASE_URL", "")


def _configure_databases() -> dict:
    # Railway official guide: PG* reference variables from the Postgres service.
    if os.getenv("PGHOST"):
        return {
            "default": {
                "ENGINE": "django.db.backends.postgresql",
                "NAME": os.environ["PGDATABASE"],
                "USER": os.environ["PGUSER"],
                "PASSWORD": os.environ["PGPASSWORD"],
                "HOST": os.environ["PGHOST"],
                "PORT": os.environ["PGPORT"],
            }
        }

    if DATABASE_URL:
        import dj_database_url

        ssl_require = not DEBUG and "railway.internal" not in DATABASE_URL
        return {
            "default": dj_database_url.parse(
                DATABASE_URL,
                conn_max_age=600,
                ssl_require=ssl_require,
            )
        }

    return {
        "default": {
            "ENGINE": "django.db.backends.sqlite3",
            "NAME": BASE_DIR / "db.sqlite3",
        }
    }


DATABASES = _configure_databases()

AUTH_PASSWORD_VALIDATORS = [
    {"NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator"},
    {"NAME": "django.contrib.auth.password_validation.MinimumLengthValidator"},
    {"NAME": "django.contrib.auth.password_validation.CommonPasswordValidator"},
    {"NAME": "django.contrib.auth.password_validation.NumericPasswordValidator"},
]

LANGUAGE_CODE = "en-us"
TIME_ZONE = "UTC"
USE_I18N = True
USE_TZ = True

STATIC_URL = "static/"
STATIC_ROOT = BASE_DIR / "staticfiles"
STORAGES = {
    "default": {
        "BACKEND": "django.core.files.storage.FileSystemStorage",
    },
    "staticfiles": {
        "BACKEND": "whitenoise.storage.CompressedManifestStaticFilesStorage",
    },
}

DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

CORS_ALLOWED_ORIGINS = _csv_env("CORS_ALLOWED_ORIGINS", "http://localhost:3000")

# Allow Vercel preview + production URLs (each deployment gets its own *.vercel.app host).
if os.getenv("RAILWAY_ENVIRONMENT"):
    CORS_ALLOWED_ORIGIN_REGEXES = [
        r"^https://[\w-]+\.vercel\.app$",
    ]
else:
    CORS_ALLOWED_ORIGIN_REGEXES = []

REST_FRAMEWORK = {
    "DEFAULT_RENDERER_CLASSES": [
        "rest_framework.renderers.JSONRenderer",
    ],
    "DEFAULT_THROTTLE_CLASSES": [
        "rest_framework.throttling.AnonRateThrottle",
    ],
    "DEFAULT_THROTTLE_RATES": {
        "anon": os.getenv("API_ANON_THROTTLE", "30/minute"),
    },
}

if not DEBUG:
    SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")
    # Railway terminates TLS at the edge; internal health checks hit HTTP on $PORT.
    _ssl_redirect_default = "False" if os.getenv("RAILWAY_ENVIRONMENT") else "True"
    SECURE_SSL_REDIRECT = os.getenv("SECURE_SSL_REDIRECT", _ssl_redirect_default).lower() == "true"
    SESSION_COOKIE_SECURE = True
    CSRF_COOKIE_SECURE = True
    SECURE_HSTS_SECONDS = 31536000
    SECURE_HSTS_INCLUDE_SUBDOMAINS = True

LOGGING = {
    "version": 1,
    "disable_existing_loggers": False,
    "formatters": {
        "verbose": {
            "format": "{levelname} {asctime} {name} {message}",
            "style": "{",
        },
    },
    "handlers": {
        "console": {
            "class": "logging.StreamHandler",
            "formatter": "verbose",
        },
    },
    "root": {
        "handlers": ["console"],
        "level": os.getenv("LOG_LEVEL", "INFO"),
    },
    "loggers": {
        "django.request": {
            "handlers": ["console"],
            "level": "WARNING",
            "propagate": False,
        },
        "trip": {
            "handlers": ["console"],
            "level": os.getenv("TRIP_LOG_LEVEL", "INFO"),
            "propagate": False,
        },
    },
}
