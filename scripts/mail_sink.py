"""Local SMTP inbox for testing; messages are saved under .local/mail, never relayed.

Run with Python 3.11 or earlier, for example /usr/bin/python3 scripts/mail_sink.py.
The standard-library smtpd and asyncore modules were removed in Python 3.12.
"""
from pathlib import Path
import sys
from time import time_ns


def main():
    if sys.version_info >= (3, 12):
        raise SystemExit("Use Python <= 3.11; this local inbox requires smtpd and asyncore.")

    import asyncore
    import smtpd

    inbox = Path(__file__).resolve().parents[1] / ".local" / "mail"
    inbox.mkdir(parents=True, exist_ok=True)

    class MailSink(smtpd.SMTPServer):
        def process_message(self, peer, mailfrom, rcpttos, data, **kwargs):
            (inbox / (str(time_ns()) + ".eml")).write_bytes(data)
            return None

    server = MailSink(("127.0.0.1", 21025), None, decode_data=False)
    print("Test SMTP inbox: 127.0.0.1:21025 → .local/mail; no external delivery", flush=True)
    try:
        asyncore.loop()
    except KeyboardInterrupt:
        pass
    finally:
        server.close()


if __name__ == "__main__":
    main()
