import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './modules/users/users.module';
import { AuthModule } from './modules/auth/auth.module';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SeedsModule } from './database/seeds/seeds.module';
import { CompaniesModule } from './modules/companies/companies.module';
import { VehiclesModule } from './modules/vehicles/vehicles.module';
import { RoutesModule } from './modules/routes/routes.module';
import { TripsModule } from './modules/trips/trips.module';
import { BookingsModule } from './modules/bookings/bookings.module';
import { SettingsModule } from './modules/settings/settings.module';
import { RouteLinesModule } from './modules/route-lines/route-lines.module';
import { RouteSchedulesModule } from './modules/route-schedules/route-schedules.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),

    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.POSTGRES_HOST || 'localhost',
      port: Number(process.env.POSTGRES_PORT || 5432),
      username: process.env.POSTGRES_USER || 'postgres',
      password: process.env.POSTGRES_PASSWORD || 'postgres',
      database: process.env.POSTGRES_DB || 'quanly_xegh',
      autoLoadEntities: true,
      synchronize: true,
    }),
    UsersModule, 
    AuthModule,
    SeedsModule,
    CompaniesModule,
    VehiclesModule,
    RoutesModule,
    TripsModule,
    BookingsModule,
    SettingsModule,
    RouteLinesModule,
    RouteSchedulesModule
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
