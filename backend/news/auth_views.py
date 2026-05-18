from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.models import User
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework import status


def serialize_user(user):
    return {
        "id": user.id,
        "username": user.username,
        "first_name": user.first_name,
        "last_name": user.last_name,
        "email": user.email,
        "avatar": "/default-avatar.svg",
    }


@api_view(["POST"])
@permission_classes([AllowAny])
def register_user(request):
    first_name = (request.data.get("first_name") or "").strip()
    last_name = (request.data.get("last_name") or "").strip()
    email = (request.data.get("email") or "").strip().lower()
    phone = (request.data.get("phone") or "").strip()
    password = request.data.get("password") or ""
    confirm_password = request.data.get("confirm_password") or ""
    username = (request.data.get("username") or email or phone).strip()

    if not first_name or not last_name or not email or not password:
        return Response({"detail": "Thiếu thông tin bắt buộc"}, status=status.HTTP_400_BAD_REQUEST)

    if password != confirm_password:
        return Response({"detail": "Mật khẩu xác nhận không khớp"}, status=status.HTTP_400_BAD_REQUEST)

    if User.objects.filter(username=username).exists():
        return Response({"detail": "Tên đăng nhập đã tồn tại"}, status=status.HTTP_400_BAD_REQUEST)

    if User.objects.filter(email=email).exists():
        return Response({"detail": "Email đã được sử dụng"}, status=status.HTTP_400_BAD_REQUEST)

    user = User.objects.create_user(
        username=username,
        email=email,
        password=password,
        first_name=first_name,
        last_name=last_name,
    )
    user.save()

    return Response(
        {
            "message": "Đăng ký thành công",
            "user": serialize_user(user),
            "phone": phone,
        },
        status=status.HTTP_201_CREATED,
    )


@api_view(["POST"])
@permission_classes([AllowAny])
def login_user(request):
    identifier = (request.data.get("identifier") or request.data.get("email") or request.data.get("username") or "").strip()
    password = request.data.get("password") or ""

    if not identifier or not password:
        return Response({"detail": "Thiếu tên đăng nhập hoặc mật khẩu"}, status=status.HTTP_400_BAD_REQUEST)

    user = User.objects.filter(username=identifier).first() or User.objects.filter(email=identifier).first()

    if user is None:
        return Response({"detail": "Tài khoản không tồn tại"}, status=status.HTTP_401_UNAUTHORIZED)

    authenticated_user = authenticate(request, username=user.username, password=password)
    if authenticated_user is None:
        return Response({"detail": "Sai mật khẩu"}, status=status.HTTP_401_UNAUTHORIZED)

    login(request, authenticated_user)
    return Response(
        {
            "message": "Đăng nhập thành công",
            "user": serialize_user(authenticated_user),
        }
    )


@api_view(["POST"])
@permission_classes([AllowAny])
def logout_user(request):
    logout(request)
    return Response({"message": "Đăng xuất thành công"})


@api_view(["GET"])
@permission_classes([AllowAny])
def get_current_user(request):
    """Fetch current authenticated user from session"""
    if request.user.is_authenticated:
        return Response({"user": serialize_user(request.user)})
    return Response({"user": None})


@api_view(["PUT"])
def update_profile(request):
    """Update user profile (requires authentication)"""
    if not request.user.is_authenticated:
        return Response({"detail": "Authentication required"}, status=status.HTTP_401_UNAUTHORIZED)
    
    user = request.user
    
    # Update allowed fields
    if "first_name" in request.data:
        user.first_name = (request.data.get("first_name") or "").strip()
    if "last_name" in request.data:
        user.last_name = (request.data.get("last_name") or "").strip()
    if "email" in request.data:
        new_email = (request.data.get("email") or "").strip().lower()
        if new_email != user.email and User.objects.filter(email=new_email).exists():
            return Response({"detail": "Email đã được sử dụng"}, status=status.HTTP_400_BAD_REQUEST)
        user.email = new_email
    
    user.save()
    return Response({
        "message": "Cập nhật hồ sơ thành công",
        "user": serialize_user(user),
    })


@api_view(["POST"])
def change_password(request):
    """Change user password (requires authentication)"""
    if not request.user.is_authenticated:
        return Response({"detail": "Authentication required"}, status=status.HTTP_401_UNAUTHORIZED)
    
    old_password = request.data.get("old_password") or ""
    new_password = request.data.get("new_password") or ""
    confirm_password = request.data.get("confirm_password") or ""
    
    if not old_password or not new_password or not confirm_password:
        return Response({"detail": "Thiếu thông tin bắt buộc"}, status=status.HTTP_400_BAD_REQUEST)
    
    if new_password != confirm_password:
        return Response({"detail": "Mật khẩu xác nhận không khớp"}, status=status.HTTP_400_BAD_REQUEST)
    
    if new_password == old_password:
        return Response({"detail": "Mật khẩu mới phải khác mật khẩu cũ"}, status=status.HTTP_400_BAD_REQUEST)
    
    user = request.user
    if not user.check_password(old_password):
        return Response({"detail": "Mật khẩu cũ không đúng"}, status=status.HTTP_401_UNAUTHORIZED)
    
    user.set_password(new_password)
    user.save()
    
    # Keep user logged in after password change
    login(request, user)
    
    return Response({"message": "Thay đổi mật khẩu thành công"})


@api_view(["POST"])
@permission_classes([AllowAny])
def forgot_password(request):
    """Request password reset (simplified - in production use email)"""
    identifier = (request.data.get("email") or request.data.get("username") or "").strip()
    
    if not identifier:
        return Response({"detail": "Email hoặc tên đăng nhập bắt buộc"}, status=status.HTTP_400_BAD_REQUEST)
    
    user = User.objects.filter(username=identifier).first() or User.objects.filter(email=identifier).first()
    
    if not user:
        # For security, don't reveal if user exists
        return Response({"message": "Nếu tài khoản tồn tại, bạn sẽ nhận được hướng dẫn đặt lại mật khẩu"})
    
    # TODO: In production, send password reset email with token
    # For now, just return success message
    return Response({
        "message": "Hướng dẫn đặt lại mật khẩu đã được gửi",
        # Note: In production, never return user data for security
    })
