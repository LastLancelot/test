import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ApiProperty } from '@nestjs/swagger';
import * as mongoose from 'mongoose';
export type UserDocument = Csv & Document;

@Schema()
export class Csv {
  @Prop({
    type: mongoose.Schema.ObjectId,
    ref: Csv.name,
  })
  csv: Csv;

  @ApiProperty()
  @Prop({
    required: true,
    name: 'phoneNumber',
  })
  phoneNumber: string;
  @ApiProperty()
  @Prop()
  firstName: string;

  @ApiProperty()
  @Prop()
  lastName: string;

  @ApiProperty()
  @Prop()
  fullName: string;
}

export const CsvSchema = SchemaFactory.createForClass(Csv);
