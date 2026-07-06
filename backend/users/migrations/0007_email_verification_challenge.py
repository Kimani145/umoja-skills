import uuid

from django.db import migrations, models
from django.db.models import Q
from django.db.models import deletion


class Migration(migrations.Migration):

    dependencies = [
        ('users', '0006_adminactivitylog'),
    ]

    operations = [
        migrations.AddField(
            model_name='user',
            name='email_verified',
            field=models.BooleanField(db_index=True, default=False),
        ),
        migrations.CreateModel(
            name='EmailVerificationChallenge',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('purpose', models.CharField(choices=[('REGISTER', 'Register'), ('LOGIN', 'Login')], db_index=True, max_length=20)),
                ('code', models.CharField(db_index=True, max_length=6)),
                ('expires_at', models.DateTimeField()),
                ('used', models.BooleanField(db_index=True, default=False)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('user', models.ForeignKey(on_delete=deletion.CASCADE, related_name='email_verification_challenges', to='users.user')),
            ],
            options={
                'ordering': ['-created_at'],
            },
        ),
        migrations.AddConstraint(
            model_name='user',
            constraint=models.UniqueConstraint(
                fields=['phone'],
                condition=~Q(phone=''),
                name='unique_user_phone',
            ),
        ),
        migrations.AddConstraint(
            model_name='emailverificationchallenge',
            constraint=models.UniqueConstraint(
                fields=['user', 'purpose'],
                condition=Q(used=False),
                name='unique_active_email_verification_challenge_per_user_purpose',
            ),
        ),
        migrations.AddIndex(
            model_name='emailverificationchallenge',
            index=models.Index(fields=['user', 'purpose', 'used'], name='idx_email_verif_active'),
        ),
    ]