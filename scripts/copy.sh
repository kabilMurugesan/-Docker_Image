#!/bin/bash
echo "==>Copying env from S3"
if [ "$DEPLOYMENT_GROUP_NAME" == "dev-api" ]
then
 aws s3 cp s3://gobox-config/api/dev/.env /var/www/gobox-api/.env
elif [ "$DEPLOYMENT_GROUP_NAME" == "stage-api" ]
then
  aws s3 cp s3://gobox-config/api/stage/.env /var/www/gobox-api/.env
elif [ "$DEPLOYMENT_GROUP_NAME" == "prod-api" ]
then
 aws s3 cp s3://gobox-config/api/prod/.env /var/www/gobox-api/.env
fi
