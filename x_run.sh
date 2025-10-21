arg=$1
if [ "$arg" == "start" ]; then
    python manage.py runserver
elif [ "$arg" == "stop" ]; then
    python manage.py stopserver
elif [ "$arg" == "restart" ]; then
    python manage.py restartserver
fi